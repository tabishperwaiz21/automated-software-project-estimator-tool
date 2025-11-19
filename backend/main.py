from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from estimator import compute_ufp, compute_fp, estimate_effort_and_time

app = FastAPI()

# CORS so frontend can talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Entity(BaseModel):
    count: int
    complexities: list[str]

class RequestModel(BaseModel):
    title: str
    description: str
    inputs: Entity
    outputs: Entity
    inquiries: Entity
    files: Entity
    interfaces: Entity
    environment_complexity: int
    project_mode: str
    language: str
    salary_per_month: int
    team_size: int

@app.post("/estimate")
def estimate(data: RequestModel):

    print("[/estimate] payload:", data.dict())

    # Step 1: Calculate UFP (Unadjusted Function Points)
    ufp = compute_ufp(data.dict())

    # Step 2: Calculate TCF (Technical Complexity Factor) and FP
    # TCF = 0.65 + 0.01 * (Overall Environment Complexity)
    tcf = 0.65 + (0.01 * data.environment_complexity)
    fp = compute_fp(ufp, data.environment_complexity)

    # Step 3: Estimate Effort, Development Time, and Cost using COCOMO
    effort, tdev_months, cost, time_formatted = estimate_effort_and_time(
        fp,
        data.language,
        data.project_mode,
        data.team_size,
        data.salary_per_month,
    )

    return {
        "UFP": ufp,
        "FP": round(fp, 2),
        "Effort_person_months": effort,
        "Time_months": tdev_months,
        "Time_formatted": time_formatted,
        "Cost_Rupees": cost,
    }
