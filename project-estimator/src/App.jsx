import React, { useState, useEffect } from "react";

// Reusable radio group component
function RadioGroup({ label, options, value, onChange }) {
  return (
    <div className="mb-4">
      <div className="text-sm font-medium mb-1">{label}</div>
      <div className="flex flex-col gap-1">
        {options.map(opt => (
          <label key={opt.value} className="flex items-center gap-2">
            <input
              type="radio"
              name={label}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="accent-blue-600"
            />
            <span className="text-sm">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

const LANGS = [
  "Assembly Language","C","C++","C#","COBOL","Fortran","Java","JavaScript","Python","Ruby","SQL","TypeScript"
].sort((a,b)=> a.localeCompare(b));

function clampNumber(n, min=0, max=99){ return Math.max(min, Math.min(max, Number(n)||0)); }

function formatMonthsToYearsMonths(monthsRaw){
  const months = Math.round(monthsRaw);
  if (Number.isNaN(months)) return "";
  if (months < 12) return `${months} months`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem === 0 ? `${years} years` : `${years} years ${rem} months`;
}

// --- Reusable NumberInput component ---
function NumberInput({ value, onChange, min = 0, max = 999999 }) {
  const [internal, setInternal] = React.useState(value);

  // Sync when parent changes
  React.useEffect(() => {
    setInternal(value);
  }, [value]);

  const handleFocus = () => {
    // Clear only if it matches the default
    if (internal === value) setInternal("");
  };

  const handleChange = (e) => {
    const val = e.target.value;

    // Allow blank input & typing freely
    setInternal(val);

    // Only call parent if it's a number
    if (val === "") return;

    const num = Number(val);
    if (!isNaN(num)) {
      onChange(num); // do NOT clamp here
    }
  };

  const handleBlur = () => {
    if (internal === "") {
      // empty — restore previous value
      setInternal(value);
      return;
    }

    let num = Number(internal);

    // Clamp ONLY on blur
    if (num < min) num = min;
    if (num > max) num = max;

    setInternal(num);
    onChange(num);
  };

  return (
    <input
      type="number"
      min={min}
      max={max}
      value={internal}
      onFocus={handleFocus}
      onChange={handleChange}
      onBlur={handleBlur}
      className="mt-1 block w-full border rounded-lg px-4 py-3"
    />
  );
}

// --- Helper for counts + arrays ---
function useCountArray(initialCount=0) {
  const [count, setCount] = useState(initialCount);
  const [arr, setArr] = useState([]);

  const updateCount = (val) => {
    const c = clampNumber(val);
    setCount(c);
    setArr(prev => {
      const newArr = [...prev];
      while(newArr.length < c) newArr.push("simple");
      while(newArr.length > c) newArr.pop();
      return newArr;
    });
  };

  return [count, arr, updateCount, setArr];
}

// Main questionnaire component
function ProjectQuestionnaire({ onModeChange, onTeamSizeChange, onSalaryChange }) {
  const [projectType, setProjectType] = useState(""); // app / utility / system
  const [constraints, setConstraints] = useState(""); // none / some / critical
  const [techExperience, setTechExperience] = useState(""); // skilled / average / beginner
  const [similarExperience, setSimilarExperience] = useState(""); // yes / limited / none
  const [teamSize, setTeamSize] = useState(3);
  const [avgSalary, setAvgSalary] = useState(50000);

  const [mode, setMode] = useState("organic"); // default

  // scoring system
  useEffect(() => {
    let scores = { organic: 0, semi: 0, embedded: 0 };

    // project type
    if (projectType === "app") { scores.organic += 1; scores.semi += 1; }
    if (projectType === "utility") { scores.semi += 1; scores.embedded += 1; }
    if (projectType === "system") { scores.embedded += 2; }

    // constraints
    if (constraints === "none") scores.organic += 1;
    if (constraints === "some") scores.semi += 1;
    if (constraints === "critical") scores.embedded += 2;

    // tech experience
    if (techExperience === "skilled") scores.organic += 2;
    if (techExperience === "average") scores.semi += 2;
    if (techExperience === "beginner") scores.embedded += 2;

    // similar project experience
    if (similarExperience === "yes") scores.organic += 2;
    if (similarExperience === "limited") scores.semi += 2;
    if (similarExperience === "none") scores.embedded += 2;

    // small adjustment by team size (optional)
    if (teamSize <= 5) scores.organic += 1;
    if (teamSize > 5 && teamSize <= 15) scores.semi += 1;
    if (teamSize > 15) scores.embedded += 1;

    // determine mode
    const maxScore = Math.max(scores.organic, scores.semi, scores.embedded);
    const projectMode =
      maxScore === scores.organic ? "organic" :
      maxScore === scores.semi ? "semi-detached" :
      "embedded";

    setMode(projectMode);

    // callback to parent
    if (onModeChange) onModeChange(projectMode);
  }, [projectType, constraints, techExperience, similarExperience, teamSize, avgSalary, onModeChange]);

  // Notify parent of team size and salary changes
  useEffect(() => {
    if (onTeamSizeChange) onTeamSizeChange(teamSize);
  }, [teamSize, onTeamSizeChange]);

  useEffect(() => {
    if (onSalaryChange) onSalaryChange(avgSalary);
  }, [avgSalary, onSalaryChange]);

  return (
    <div className="mt-4 p-4 rounded-md bg-blue-50 text-gray-700">
      <h3 className="text-center font-semibold mb-4">Project & Team Questionnaire</h3>

      <RadioGroup
        label="Project Type"
        value={projectType}
        onChange={setProjectType}
        options={[
          { label: "Application Program (Payroll, Inventory, etc.)", value: "app" },
          { label: "Utility Program (Compiler, DB engine, etc.)", value: "utility" },
          { label: "System/Embedded Program (OS, Firmware, RT system)", value: "system" },
        ]}
      />

      {(projectType === "utility" || projectType === "system") && (
        <RadioGroup
          label="Constraints / Hardware Dependency"
          value={constraints}
          onChange={setConstraints}
          options={[
            { label: "No special requirements", value: "none" },
            { label: "Some timing/memory constraints", value: "some" },
            { label: "Critical timing/hardware requirements", value: "critical" },
          ]}
        />
      )}

      <RadioGroup
        label="Team Experience in Technology"
        value={techExperience}
        onChange={setTechExperience}
        options={[
          { label: "Highly Skilled", value: "skilled" },
          { label: "Average", value: "average" },
          { label: "Beginner / Unfamiliar", value: "beginner" },
        ]}
      />

      <RadioGroup
        label="Team Experience with Similar Projects"
        value={similarExperience}
        onChange={setSimilarExperience}
        options={[
          { label: "Yes, multiple similar projects", value: "yes" },
          { label: "Limited experience", value: "limited" },
          { label: "No prior experience", value: "none" },
        ]}
      />

      <div className="mb-4">
        <label className="block text-sm font-medium">Team Size</label>
        <NumberInput value={teamSize} onChange={setTeamSize} min={1} max={999} />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium">Average Monthly Salary (₹)</label>
        <NumberInput value={avgSalary} onChange={setAvgSalary} min={0} max={9999999} />
      </div>

      <div className="mt-2 text-center font-medium text-blue-700">
        <span>Inferred Project Mode: </span>
        <span className="font-bold">{mode.toUpperCase()}</span>
      </div>
    </div>
  );
}

export default function App(){
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // counts + arrays using helper
  const [inputsCount, inputsArr, setInputsCount, setInputsArr] = useCountArray();
  const [outputsCount, outputsArr, setOutputsCount, setOutputsArr] = useCountArray();
  const [inquiriesCount, inquiriesArr, setInquiriesCount, setInquiriesArr] = useCountArray();
  const [filesCount, filesArr, setFilesCount, setFilesArr] = useCountArray();
  const [interfacesCount, interfacesArr, setInterfacesCount, setInterfacesArr] = useCountArray();

  const [envComplexity, setEnvComplexity] = useState(3);

  const [projectMode, setProjectMode] = useState("organic"); // gets updated by questionnaire
  const [teamSize, setTeamSize] = useState(3);
  const [avgSalary, setAvgSalary] = useState(50000);
  
  const [language, setLanguage] = useState("");
  const [estimating, setEstimating] = useState(false);
  const [cost, setCost] = useState(null);
  const [timeText, setTimeText] = useState("");

  function ComplexitySelect({value, onChange}){
    return (
      <select
        value={value}
        onChange={e=>onChange(e.target.value)}
        className="ml-3 border rounded px-2 py-1 text-sm"
      >
        <option value="simple">Simple</option>
        <option value="average">Average</option>
        <option value="complex">Complex</option>
      </select>
    );
  }

  async function handleEstimate(){
    if (!language) { alert("Select a programming language."); return; }

    const payload = {
      title, 
      description,
      inputs: { count: inputsArr.length, complexities: inputsArr },
      outputs: { count: outputsArr.length, complexities: outputsArr },
      inquiries: { count: inquiriesArr.length, complexities: inquiriesArr },
      files: { count: filesArr.length, complexities: filesArr },
      interfaces: { count: interfacesArr.length, complexities: interfacesArr },
      environment_complexity: envComplexity,
      project_mode: projectMode,
      language,
      salary_per_month: avgSalary,
      team_size: teamSize
    };

    try{
      setEstimating(true);
      setCost(null);
      setTimeText("");
      const res = await fetch("http://localhost:8000/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if(!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setCost(data.Cost_Rupees ?? null);
      // Use the formatted time from backend
      setTimeText(data.Time_formatted ?? "");
    }catch(err){
      console.error(err);
      alert("Estimate failed: " + (err.message || err));
    }finally{
      setEstimating(false);
    }
  }

  // --- render count blocks ---
  const renderCountBlock = (label, count, arr, setCount, setArr, prefix) => (
    <div>
      <label className="block text-sm font-medium">{label} (0-99)</label>
      <NumberInput value={count} onChange={setCount} />
      <div className="mt-3 grid grid-cols-1 gap-2">
        {arr.map((val, i)=>(
          <div key={i} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
            <div className="text-sm font-medium">{prefix}{i+1}</div>
            <ComplexitySelect value={val} onChange={v => {
              setArr(prev => {
                const a = [...prev]; a[i] = v; return a;
              });
            }} />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-8 flex justify-center">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 11h10M4 15h16" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>
          <h1 className="text-4xl font-extrabold mt-4">Software Project Cost and Time Estimation</h1>
          <p className="text-gray-500 mt-2">Function Point Analysis based estimation tool</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Project Details</h2>
          <p className="text-sm text-gray-500 mb-4">Enter your project information to get cost and time estimates</p>

          <label className="block text-sm font-medium">Project Title</label>
          <input value={title} onChange={e=>setTitle(e.target.value)}
            placeholder="Enter project title"
            className="mt-1 mb-4 block w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />

          <label className="block text-sm font-medium">Project Description</label>
          <textarea value={description} onChange={e=>setDescription(e.target.value)}
            placeholder="Enter detailed project description"
            rows={6}
            className="mt-1 mb-4 block w-full border rounded-lg px-4 py-3 resize"
            style={{minHeight: "120px"}}
          />

          <div className="space-y-4">
            {renderCountBlock("Number of Inputs", inputsCount, inputsArr, setInputsCount, setInputsArr, "EI")}
            {renderCountBlock("Number of Outputs", outputsCount, outputsArr, setOutputsCount, setOutputsArr, "EO")}
            {renderCountBlock("Number of Inquiries", inquiriesCount, inquiriesArr, setInquiriesCount, setInquiriesArr, "EQ")}
            {renderCountBlock("Number of Files", filesCount, filesArr, setFilesCount, setFilesArr, "ILF")}
            {renderCountBlock("Number of Interfaces", interfacesCount, interfacesArr, setInterfacesCount, setInterfacesArr, "EIF")}
          </div>

          {/* Slider */}
          <div className="mt-6">
            <label className="block text-sm font-medium mb-2">Overall Environment Complexity</label>
            <div className="flex items-center gap-4">
              <div className="text-xs text-gray-500">No influence (0)</div>
              <input type="range" min="0" max="6" value={envComplexity} onChange={e=>setEnvComplexity(Number(e.target.value))}
                className="flex-1 w-full accent-blue-600"
              />
              <div className="text-xs text-gray-500 text-right">Strong influence (6)</div>
            </div>
            <div className="text-center mt-2 text-sm text-gray-700 font-medium">{envComplexity}</div>
          </div>

          {/* Questionnaire box */}
          <ProjectQuestionnaire 
            onModeChange={setProjectMode}
            onTeamSizeChange={setTeamSize}
            onSalaryChange={setAvgSalary}
          />

          {/* Language */}
          <div className="mt-4">
            <label className="block text-sm font-medium">Select Programming Language</label>
            <select value={language} onChange={e=>setLanguage(e.target.value)}
              className="mt-1 block w-full border rounded-lg px-4 py-3"
            >
              <option value="">Select a language</option>
              {LANGS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div className="mt-6">
            <button onClick={handleEstimate}
              className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-white ${estimating ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3v18M3 12h18" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Estimate
            </button>
          </div>

          {cost !== null && (
            <div className="mt-6 bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 font-semibold">Estimated Cost (in Indian Rupees)</div>
              <div className="mt-1 text-xl font-bold">₹{typeof cost === "number" ? cost.toLocaleString() : cost}</div>

              <div className="mt-4 text-sm text-gray-600 font-semibold">Estimated Development Time</div>
              <div className="mt-1 text-xl font-bold">{timeText}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
