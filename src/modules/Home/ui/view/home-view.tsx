"use client";

import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { BuildingIcon, CalendarIcon, MoreHorizontalIcon, BrainCircuit, FileTextIcon, SparklesIcon, TrashIcon, EditIcon, LinkIcon, LoaderIcon } from "lucide-react";
import { createJob, updateJob, deleteJob, updateJobStatus } from "@/app/actions/job-actions";
import { parseJobDescription } from "@/app/actions/ai-actions";
import { toast } from "sonner"; 

// Types ///////////////////////////////////////////////////////////
type Job = {
  _id?: string;
  id: string; // Internal Drag ID, Maps to Mongo _id usually
  company: string;
  role: string;
  jdLink?: string;
  notes?: string;
  dateApplied: string;
  status: string;
  salary?: string;
  location: string;
  description: string;
  aiFeedback: string;
  logoColor: string;
};

type ColumnData = {
  id: string;
  title: string;
  jobIds: string[];
};

type BoardData = {
  jobs: Record<string, Job>;
  columns: Record<string, ColumnData>;
  columnOrder: string[];
};

// Helpers /////////////////////////////////////////////////////////
function buildBoardData(serverJobs: any[]): BoardData {
  const jobsObj: Record<string, Job> = {};
  const columns: Record<string, ColumnData> = {
    "applied": { id: "applied", title: "Applied", jobIds: [] },
    "phone-screen": { id: "phone-screen", title: "Screening", jobIds: [] },
    "interview": { id: "interview", title: "Interview", jobIds: [] },
    "offer": { id: "offer", title: "Offer", jobIds: [] },
    "rejected": { id: "rejected", title: "Rejected", jobIds: [] },
  };

  serverJobs.forEach(j => {
    const job: Job = { ...j, id: j._id.toString() };
    jobsObj[job.id] = job;
    if (columns[job.status]) columns[job.status].jobIds.push(job.id);
    else columns["applied"].jobIds.push(job.id);
  });

  return { jobs: jobsObj, columns, columnOrder: ["applied", "phone-screen", "interview", "offer", "rejected"] };
}

// MAIN COMPONENT //////////////////////////////////////////////////
export default function HomeView({ initialServerJobs = [] }: { initialServerJobs?: any[] }) {
  const [data, setData] = useState<BoardData>(buildBoardData(initialServerJobs));
  const [isMounted, setIsMounted] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  
  // Standard Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // AI Parser specific states
  const [isParserOpen, setIsParserOpen] = useState(false);
  const [rawJDInput, setRawJDInput] = useState("");
  const [isParsingLoading, setIsParsingLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    company: "",
    role: "",
    status: "applied",
    jdLink: "",
    salary: "",
    dateApplied: new Date().toISOString().split('T')[0],
    notes: "" // Now capturing location via UI inputs manually if need be or relying on default mapping
  });
  
  // For locations parsed by AI we inject them securely back into Form via hidden field fallback if it doesn't exist,
  // but to adhere strictly to your instructions we are only putting Skills/Seniority into "notes". Since the original requested fields for CRUD were:
  // "company, role, JD link, notes, date applied, status, salary range (optional)"
  // Location wasn't explicitly requested as a form field, but is in the AI parser. I'll add an AI memory state just to pass it gracefully down on save.
  const [aiLocation, setAiLocation] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);

  // Synchronize incoming SSR props just in case navigation triggers refetch
  useEffect(() => {
    setData(buildBoardData(initialServerJobs));
  }, [initialServerJobs]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ company: "", role: "", status: "applied", jdLink: "", salary: "", dateApplied: new Date().toISOString().split('T')[0], notes: "" });
    setAiLocation("");
    setIsEditMode(false);
  };

  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const openEditMode = () => {
    if (selectedJob) {
      setFormData({
        company: selectedJob.company || "",
        role: selectedJob.role || "",
        status: selectedJob.status || "applied",
        jdLink: selectedJob.jdLink || "",
        salary: selectedJob.salary || "",
        dateApplied: selectedJob.dateApplied || "",
        notes: selectedJob.notes || selectedJob.description || ""
      });
      setIsEditMode(true);
    }
  };

  // AI INTEGRATION /////////////////////////////////////////////////
  const handleParseJD = async () => {
    if (!rawJDInput.trim()) {
      toast?.error("Please paste a job description first.");
      return;
    }
    
    setIsParserOpen(false);
    setIsParsingLoading(true);
    
    try {
      const res = await parseJobDescription(rawJDInput);
      if (res.success && res.data) {
        toast?.success("Successfully parsed AI logic!");
        
        let formattedSkills = ``;
        if (res.data.requiredSkills && res.data.requiredSkills.length > 0) {
          formattedSkills += `\nRequired:\n- ${res.data.requiredSkills.join("\n- ")}`;
        }
        if (res.data.niceToHaveSkills && res.data.niceToHaveSkills.length > 0) {
          formattedSkills += `\n\nBonus:\n- ${res.data.niceToHaveSkills.join("\n- ")}`;
        }

        const skillsNote = `=== AI Extraction ===\nSeniority Level: ${res.data.seniority || "Unknown"}\nLocation: ${res.data.location || "Unknown"}\n${formattedSkills}`;
        
        setFormData({
          company: res.data.companyName || "",
          role: res.data.role || "",
          status: "applied",
          jdLink: "",
          salary: "",
          dateApplied: new Date().toISOString().split('T')[0],
          notes: skillsNote
        });
        setAiLocation(res.data.location || "Remote");
        
        setRawJDInput("");
        setIsAddModalOpen(true);
      } else {
        toast?.error(res.error || "Failed to extract structured data.");
        setIsParserOpen(true);
      }
    } catch (e: any) {
      toast?.error(e.message || "An unexpected error occurred during AI processing.");
      setIsParserOpen(true);
    } finally {
      setIsParsingLoading(false);
    }
  };


  // CRUD SAVES ////////////////////////////////////////////////////
  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Inject any AI parsed location dynamically if needed, otherwise rely on backend defaults
    const finalPayload = { ...formData, ...(aiLocation && !isEditMode ? { location: aiLocation } : {}) };

    try {
      if (isEditMode && selectedJob) {
        const res = await updateJob(selectedJob.id, finalPayload);
        if (res.success) {
          toast?.success("Application updated successfully");
          const updatedJob = { ...selectedJob, ...finalPayload, description: finalPayload.notes };
          
          let newColumns = { ...data.columns };
          if (selectedJob.status !== finalPayload.status) {
            newColumns[selectedJob.status].jobIds = newColumns[selectedJob.status].jobIds.filter(id => id !== selectedJob.id);
            if (newColumns[finalPayload.status]) newColumns[finalPayload.status].jobIds.push(selectedJob.id);
          }
          
          setData(prev => ({ ...prev, jobs: { ...prev.jobs, [selectedJob.id]: updatedJob }, columns: newColumns }));
          setSelectedJob(updatedJob);
          setIsEditMode(false);
        } else toast?.error("Failed to update application");
      } else {
        const res = await createJob(finalPayload);
        if (res.success && res.job) {
          toast?.success("Application added successfully");
          const newJob = { ...res.job, id: res.job._id };
          
          setData(prev => {
            const destColumn = prev.columns[newJob.status] ? prev.columns[newJob.status] : prev.columns["applied"];
            return {
              ...prev,
              jobs: { ...prev.jobs, [newJob.id]: newJob },
              columns: { ...prev.columns, [destColumn.id]: { ...destColumn, jobIds: [newJob.id, ...destColumn.jobIds] } }
            };
          });
          setIsAddModalOpen(false);
        } else toast?.error("Failed to add application");
      }
    } catch (err) {
      console.error(err);
      toast?.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteJob = async (id: string, columnId: string) => {
    if (!confirm("Are you sure you want to delete this application?")) return;
    setIsLoading(true);
    try {
      const res = await deleteJob(id);
      if (res.success) {
        toast?.success("Application deleted");
        setSelectedJob(null);
        setIsEditMode(false);
        
        setData(prev => {
          const newJobs = { ...prev.jobs };
          delete newJobs[id];
          return {
            ...prev,
            jobs: newJobs,
            columns: { ...prev.columns, [columnId]: { ...prev.columns[columnId], jobIds: prev.columns[columnId].jobIds.filter(jId => jId !== id) } }
          };
        });
      } else toast?.error("Failed to delete application");
    } catch (err) {
       toast?.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const startColumn = data.columns[source.droppableId];
    const finishColumn = data.columns[destination.droppableId];

    if (startColumn === finishColumn) {
      const newJobIds = Array.from(startColumn.jobIds);
      newJobIds.splice(source.index, 1);
      newJobIds.splice(destination.index, 0, draggableId);

      const newColumn = { ...startColumn, jobIds: newJobIds };
      setData({ ...data, columns: { ...data.columns, [newColumn.id]: newColumn } });
      return;
    }

    const startJobIds = Array.from(startColumn.jobIds);
    startJobIds.splice(source.index, 1);
    const newStart = { ...startColumn, jobIds: startJobIds };

    const finishJobIds = Array.from(finishColumn.jobIds);
    finishJobIds.splice(destination.index, 0, draggableId);

    const updatedJob = { ...data.jobs[draggableId], status: finishColumn.id };
    const newFinish = { ...finishColumn, jobIds: finishJobIds };

    setData({
      ...data,
      jobs: { ...data.jobs, [updatedJob.id]: updatedJob },
      columns: { ...data.columns, [newStart.id]: newStart, [newFinish.id]: newFinish },
    });

    try {
      await updateJobStatus(draggableId, finishColumn.id);
    } catch (err) {
      console.error("Drag Drop API Error Sync:", err);
    }
  };

  if (!isMounted) return <div className="p-8"><div className="animate-pulse h-12 w-48 bg-neutral-200 dark:bg-neutral-800 rounded mb-8"></div></div>;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-4 md:p-8 w-full bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 overflow-hidden relative">
      
      {/* 🚀 JOB PILOT EXCLUSIVE AI LOADING SCREEN OVERLAY */}
      {isParsingLoading && (
        <div className="fixed inset-0 z-[100] bg-neutral-950/80 backdrop-blur-md flex flex-col items-center justify-center text-white transition-opacity duration-300">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-indigo-500 rounded-full blur-[80px] opacity-40 animate-pulse"></div>
            <div className="bg-neutral-900 border border-neutral-700/50 p-6 rounded-3xl shadow-2xl relative z-10">
              <BrainCircuit className="w-24 h-24 text-indigo-400 animate-[pulse_1.5s_ease-in-out_infinite]" />
              <SparklesIcon className="w-8 h-8 text-yellow-400 absolute -top-4 -right-4 animate-bounce" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-300 to-indigo-100 bg-clip-text text-transparent mb-3">
            AI is Analyzing JD
          </h2>
          <p className="text-neutral-400 font-medium tracking-wide">Extracting skills, roles, and deep matching insights.</p>
          <div className="w-64 h-2 bg-neutral-800/80 rounded-full mt-10 overflow-hidden border border-neutral-700/50 relative shadow-inner">
             <div className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full animate-progress" style={{ width: "60%", transformOrigin: "left", animation: "progress 2s cubic-bezier(0.4, 0, 0.2, 1) infinite" }}></div>
          </div>
        </div>
      )}

      {/* Adding a global style for the custom progress animation locally since Tailwind config isn't aware */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes progress {
          0% { transform: translateX(-100%); width: 50%; }
          50% { transform: translateX(25%); width: 70%; }
          100% { transform: translateX(200%); width: 50%; }
        }
      `}} />

      <div className="mb-8 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img src="/JobPilot%20logo%20with%20friendly%20robot.png" alt="JobPilot Logo" className="h-14 w-auto object-contain rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 p-1" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1 text-neutral-900 dark:text-white">Job Applications</h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">Track your interviews and application progress seamlessly.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => setIsParserOpen(true)}
            className="shadow-sm font-semibold rounded-full px-4 border-indigo-200 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors">
            <SparklesIcon className="w-4 h-4 mr-2" />
            AI Parser
          </Button>
          <Button variant="outline" className="shadow-sm font-semibold rounded-full px-4 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors">
            <FileTextIcon className="w-4 h-4 mr-2" />
            AI Resume Prompts
          </Button>
          <Button onClick={openAddModal} variant="default" className="shadow-sm font-semibold rounded-full px-6 xl:ml-2">
            Add New Application
          </Button>
        </div>
      </div>

      <Dialog open={isParserOpen} onOpenChange={setIsParserOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                 <BuildingIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold">Paste Job Description</h2>
            </div>
             <p className="text-sm border-b border-neutral-200 dark:border-neutral-800 pb-5 mb-5 text-neutral-500">
              Drop the raw text from LinkedIn, Indeed, or the career site below. Job Pilot AI will extract all metadata automatically.
            </p>
            
            <div className="space-y-4">
              <Textarea 
                value={rawJDInput} 
                onChange={(e) => setRawJDInput(e.target.value)} 
                placeholder="Senior Operations Manager... Must have 5 years experience in..." 
                className="min-h-[300px] bg-neutral-50 dark:bg-[#121212] font-mono text-sm leading-relaxed custom-scrollbar shadow-inner" 
              />
              <div className="pt-2 flex justify-end gap-3 flex-wrap">
                <Button type="button" variant="ghost" onClick={() => setIsParserOpen(false)}>Cancel</Button>
                <Button type="button" onClick={handleParseJD} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                  <SparklesIcon className="w-4 h-4 mr-2" /> Extract with Gemini
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Add Application</h2>
            <form onSubmit={handleSaveSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input required name="company" value={formData.company} onChange={handleFormChange} placeholder="e.g. Google" />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input required name="role" value={formData.role} onChange={handleFormChange} placeholder="e.g. Frontend Engineer" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select 
                    name="status"
                    className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300"
                    value={formData.status}
                    onChange={handleFormChange}
                  >
                    <option value="applied">Applied</option>
                    <option value="phone-screen">Phone Screen</option>
                    <option value="interview">Interview</option>
                    <option value="offer">Offer</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Date Applied</Label>
                  <Input type="date" required name="dateApplied" value={formData.dateApplied} onChange={handleFormChange} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>JD Link (Optional)</Label>
                <Input name="jdLink" type="url" value={formData.jdLink} onChange={handleFormChange} placeholder="https://..." />
              </div>
              
              <div className="space-y-2">
                <Label>Salary Range (Optional)</Label>
                <Input name="salary" value={formData.salary} onChange={handleFormChange} placeholder="$120k - $150k" />
              </div>

              <div className="space-y-2">
                <Label>Notes & AI Extraction</Label>
                <Textarea name="notes" value={formData.notes} onChange={handleFormChange} placeholder="Personal thoughts, parsed AI skills..." className="min-h-[140px] custom-scrollbar text-sm font-mono leading-relaxed bg-neutral-50 dark:bg-neutral-950" />
              </div>

              <div className="pt-4 flex justify-end gap-3 flex-wrap">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>{isLoading ? <LoaderIcon className="w-5 h-5 animate-spin" /> : 'Save Job'}</Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-6 h-full overflow-x-auto pb-4" style={{ WebkitOverflowScrolling: 'touch' }}>
          {data.columnOrder.map((columnId) => {
            const column = data.columns[columnId];
            const jobs = column.jobIds.map((jobId) => data.jobs[jobId]).filter(Boolean);

            return (
              <div key={column.id} className="flex flex-col w-80 min-w-[320px] shrink-0 bg-neutral-200/40 dark:bg-neutral-900/40 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4 px-1">
                  <h2 className="font-semibold text-[13px] uppercase tracking-widest text-neutral-600 dark:text-neutral-400">
                    {column.title} <span className="ml-2 text-neutral-500 dark:text-neutral-500 bg-neutral-200 dark:bg-neutral-800 px-2.5 py-0.5 rounded-full text-xs">{jobs.length}</span>
                  </h2>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-neutral-900 dark:hover:text-white">
                    <MoreHorizontalIcon className="h-4 w-4" />
                  </Button>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 overflow-y-auto pr-1 min-h-[150px] transition-colors rounded-xl p-1 -m-1 custom-scrollbar ${snapshot.isDraggingOver ? 'bg-neutral-200 dark:bg-neutral-800/80' : ''}`}
                    >
                      {jobs.length === 0 && !snapshot.isDraggingOver && (
                        <div className="flex items-center justify-center h-20 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl m-2 opacity-50">
                          <p className="text-xs font-semibold text-neutral-500 uppercase">Drop Jobs Here</p>
                        </div>
                      )}
                      
                      {jobs.map((job, index) => (
                        <Draggable key={job.id} draggableId={job.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`mb-3 outline-none ${snapshot.isDragging ? 'opacity-90 scale-[1.03] rotate-2 shadow-2xl z-50' : ''}`}
                              onClick={() => {
                                setSelectedJob(job);
                                setIsEditMode(false);
                              }}
                              style={{ ...provided.draggableProps.style }}
                            >
                              <Card className="cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-600 transition-all overflow-hidden relative group bg-white dark:bg-[#121212] border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md rounded-xl">
                                <div className={`absolute top-0 left-0 w-1 h-full ${job.logoColor}`} />
                                <CardHeader className="p-4 pb-0">
                                  <div className="flex justify-between items-start gap-2">
                                    <div className="flex gap-3 items-center w-full">
                                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm ${job.logoColor} shadow-inner shrink-0`}>
                                        {job.company.substring(0, 1)}
                                      </div>
                                      <div className="flex flex-col min-w-0 pr-2">
                                        <CardTitle className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100 leading-tight truncate">{job.company}</CardTitle>
                                        <CardDescription className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate font-medium">{job.role}</CardDescription>
                                      </div>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-3">
                                  <div className="flex items-center text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-2">
                                    <CalendarIcon className="w-3.5 h-3.5 mr-1.5 opacity-80 shrink-0" />
                                    {job.dateApplied}
                                  </div>
                                  <div className="mt-2.5 flex gap-1.5 overflow-hidden flex-wrap">
                                    {job.location && typeof job.location === 'string' && <Badge variant="outline" className="border-neutral-200 dark:border-neutral-800 text-neutral-500 bg-neutral-50 dark:bg-neutral-900/50 text-[10px] uppercase font-semibold tracking-wider whitespace-nowrap truncate max-w-[130px] rounded-md shadow-sm">
                                      {job.location.split(',')[0]}
                                    </Badge>}
                                    {job.salary && <Badge variant="outline" className="border-green-200 dark:border-green-900/50 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 text-[10px] uppercase font-semibold tracking-wider rounded-md shadow-sm truncate max-w-[120px]">
                                      {job.salary}
                                    </Badge>}
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      <Dialog open={!!selectedJob && !isAddModalOpen && !isParserOpen} onOpenChange={(open) => !open && setSelectedJob(null)}>
        <DialogContent className="sm:max-w-[550px] gap-0 p-0 overflow-hidden bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
          {selectedJob && (
            isEditMode ? (
              <div className="p-6 pt-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center justify-between">
                  Edit Application
                  <Button variant="ghost" size="sm" onClick={() => setIsEditMode(false)}>Close</Button>
                </h2>
                <form onSubmit={handleSaveSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Company</Label>
                      <Input required name="company" value={formData.company} onChange={handleFormChange} />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Input required name="role" value={formData.role} onChange={handleFormChange} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <select 
                        name="status"
                        className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300"
                        value={formData.status}
                        onChange={handleFormChange}
                      >
                        <option value="applied">Applied</option>
                        <option value="phone-screen">Phone Screen</option>
                        <option value="interview">Interview</option>
                        <option value="offer">Offer</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Date Applied</Label>
                      <Input type="date" required name="dateApplied" value={formData.dateApplied} onChange={handleFormChange} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>JD Link (Optional)</Label>
                    <Input name="jdLink" type="url" value={formData.jdLink} onChange={handleFormChange} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Salary Range (Optional)</Label>
                    <Input name="salary" value={formData.salary} onChange={handleFormChange} />
                  </div>

                  <div className="space-y-2">
                    <Label>Notes & JD Details</Label>
                    <Textarea name="notes" value={formData.notes} onChange={handleFormChange} className="min-h-[140px] font-mono text-sm" />
                  </div>

                  <div className="pt-4 flex justify-between gap-3 flex-wrap">
                    <Button type="button" variant="destructive" disabled={isLoading} onClick={() => handleDeleteJob(selectedJob.id, selectedJob.status)}>
                      <TrashIcon className="w-4 h-4 mr-2" /> Delete
                    </Button>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsEditMode(false)}>Cancel</Button>
                      <Button type="submit" disabled={isLoading}>{isLoading ? <LoaderIcon className="w-5 h-5 animate-spin" />: 'Save Changes'}</Button>
                    </div>
                  </div>
                </form>
              </div>
            ) : (
            <div className="flex flex-col relative w-full pt-16 mt-6">
              <div className={`absolute top-0 left-0 w-full h-32 ${selectedJob.logoColor} opacity-90 transition-all`} style={{ zIndex: 0 }} />
              <div className="px-6 pb-6 relative" style={{ zIndex: 10 }}>
                <div className="absolute top-0 right-0 flex gap-2">
                   <Button size="icon" variant="secondary" className="bg-white/80 hover:bg-white text-neutral-800 shadow-xl border-none h-10 w-10 rounded-full" onClick={openEditMode}>
                      <EditIcon className="w-4 h-4" />
                   </Button>
                </div>
                
                <div className={`w-20 h-20 rounded-[1.25rem] flex items-center justify-center text-white font-bold text-3xl shadow-xl border-[6px] border-white dark:border-neutral-950 ${selectedJob.logoColor}`}>
                  {selectedJob.company.substring(0, 1)}
                </div>
                
                <div className="mt-4 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div className="flex flex-col">
                    <h2 className="text-[28px] font-bold tracking-tight text-neutral-900 dark:text-white leading-none mb-1.5 flex items-center gap-2">
                       {selectedJob.company}
                       {selectedJob.jdLink && (
                         <a href={selectedJob.jdLink} target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-blue-500 transition-colors">
                            <LinkIcon className="w-5 h-5" />
                         </a>
                       )}
                    </h2>
                    <p className="text-[17px] text-neutral-600 dark:text-neutral-400 font-medium">{selectedJob.role}</p>
                  </div>
                  <div>
                    <Badge className="font-semibold shadow-sm text-[12px] px-3.5 py-1.5 uppercase tracking-wider border border-neutral-200 dark:border-neutral-800 rounded-full">
                      {data.columns[selectedJob.status]?.title || selectedJob.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-6">
                  {selectedJob.salary && <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/80 col-span-2 shadow-sm">
                    <div className="bg-white dark:bg-neutral-800 p-2 rounded-lg shadow-sm border border-neutral-100 dark:border-neutral-700/50">
                      <span className="font-bold text-neutral-600 dark:text-neutral-300">$</span>
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-500">Salary Range</p>
                      <p className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-200 truncate">{selectedJob.salary}</p>
                    </div>
                  </div>}
                  
                  {selectedJob.location && <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/80">
                    <div className="bg-white dark:bg-neutral-800 p-2 rounded-lg shadow-sm border border-neutral-100 dark:border-neutral-700/50">
                      <BuildingIcon className="w-[18px] h-[18px] text-neutral-600 dark:text-neutral-400" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-500">Location</p>
                      <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-200 truncate">{selectedJob.location}</p>
                    </div>
                  </div>}
                  
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/80 w-full col-span-1">
                    <div className="bg-white dark:bg-neutral-800 p-2 rounded-lg shadow-sm border border-neutral-100 dark:border-neutral-700/50">
                      <CalendarIcon className="w-[18px] h-[18px] text-neutral-600 dark:text-neutral-400" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-500">Date Applied</p>
                      <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-200 truncate">{selectedJob.dateApplied}</p>
                    </div>
                  </div>
                </div>

                {selectedJob.notes && selectedJob.notes.trim().length > 0 && (
                <div className="mt-8">
                  <h3 className="text-[12px] font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-400 mb-3 flex items-center gap-2">
                    Private Notes & Details
                  </h3>
                  <div className="text-[14px] text-neutral-800 dark:text-neutral-300 font-mono leading-relaxed bg-neutral-50 dark:bg-[#151515] p-5 rounded-xl border border-neutral-100 dark:border-neutral-800/60 shadow-sm whitespace-pre-wrap">
                    {selectedJob.notes}
                  </div>
                </div>
                )}
                
                {(!selectedJob.notes || selectedJob.notes.trim().length === 0) && selectedJob.description && selectedJob.description.trim() !== "No description provided." && (
                <div className="mt-8">
                  <h3 className="text-[12px] font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-400 mb-3 flex items-center gap-2">
                    Description
                  </h3>
                  <div className="text-[14px] text-neutral-600 dark:text-neutral-300 leading-relaxed bg-neutral-50 dark:bg-neutral-900/40 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800/60 shadow-sm whitespace-pre-wrap">
                    {selectedJob.description}
                  </div>
                </div>
                )}

                {selectedJob.aiFeedback && (
                <div className="mt-6 shadow-md rounded-xl overflow-hidden border border-indigo-100 dark:border-indigo-900/60 relative">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
                  <div className="bg-indigo-50/80 dark:bg-[#12142B] p-5 pl-6">
                    <h3 className="text-[12px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 mb-2.5 flex items-center gap-2">
                      <BrainCircuit className="w-[18px] h-[18px] text-indigo-500" /> AI Application Insights
                    </h3>
                    <p className="text-[14px] text-indigo-900 dark:text-indigo-200 leading-relaxed font-medium">
                      "{selectedJob.aiFeedback || "Provide a JD to get AI Insights."}"
                    </p>
                  </div>
                </div>
                )}
              </div>
            </div>
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
