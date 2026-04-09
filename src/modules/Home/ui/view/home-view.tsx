"use client";

import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BuildingIcon, CalendarIcon, MoreHorizontalIcon, BrainCircuit, GripVertical } from "lucide-react";

// Types
type Job = {
  id: string;
  company: string;
  role: string;
  dateApplied: string;
  status: string;
  salary: string;
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

const initialData: BoardData = {
  jobs: {
    "job-1": {
      id: "job-1",
      company: "Google",
      role: "Senior Frontend Engineer",
      dateApplied: "2024-04-01",
      status: "applied",
      salary: "$160,000 - $210,000",
      location: "Mountain View, CA (Hybrid)",
      description: "Working on the next generation web tooling infrastructure for Google Cloud platform.",
      aiFeedback: "Your profile matches 85% of the requirements. Mention your experience with Next.js and high-performance Webpack builds.",
      logoColor: "bg-blue-500",
    },
    "job-2": {
      id: "job-2",
      company: "Stripe",
      role: "Frontend Engineer",
      dateApplied: "2024-04-02",
      status: "applied",
      salary: "$140,000 - $180,000",
      location: "Remote",
      description: "Building world-class developer experiences for the API dashboard.",
      aiFeedback: "Excellent fit. Highlight your open source contributions and Stripe API familiarity.",
      logoColor: "bg-indigo-500",
    },
    "job-3": {
      id: "job-3",
      company: "Vercel",
      role: "Software Engineer, Core",
      dateApplied: "2024-03-28",
      status: "phone-screen",
      salary: "$150,000 - $190,000",
      location: "San Francisco, CA",
      description: "Working on Next.js core framework and compiler optimization.",
      aiFeedback: "Great match! For the recruiter call, emphasize your recent compiler performance optimization project.",
      logoColor: "bg-neutral-800",
    },
    "job-4": {
      id: "job-4",
      company: "OpenAI",
      role: "Frontend Engineer, ChatGPT",
      dateApplied: "2024-03-15",
      status: "interview",
      salary: "$180,000 - $250,000",
      location: "San Francisco, CA",
      description: "Developing scalable UI interfaces for LLM inference and conversation models.",
      aiFeedback: "You have an onsite coming up! Review system design for chat platforms and real-time streaming architectures.",
      logoColor: "bg-green-600",
    },
    "job-5": {
      id: "job-5",
      company: "Linear",
      role: "Product Engineer",
      dateApplied: "2024-02-20",
      status: "offer",
      salary: "$170,000 + Equity",
      location: "Remote",
      description: "Creating magical, high-performance interactions in the Linear client.",
      aiFeedback: "Congratulations on the offer! The compensation is very competitive for this tier. Negotiate based on your competing process with Vercel.",
      logoColor: "bg-purple-600",
    },
    "job-6": {
      id: "job-6",
      company: "Netflix",
      role: "UI Engineer",
      dateApplied: "2024-02-10",
      status: "rejected",
      salary: "Unknown",
      location: "Los Gatos, CA",
      description: "Building internal tooling for content delivery and metadata generation.",
      aiFeedback: "You were filtered out likely due to the strict 5+ years requirement in UI architecture. Don't sweat it, your other processes are strong.",
      logoColor: "bg-red-600",
    },
  },
  columns: {
    "applied": { id: "applied", title: "Applied", jobIds: ["job-1", "job-2"] },
    "phone-screen": { id: "phone-screen", title: "Phone Screen", jobIds: ["job-3"] },
    "interview": { id: "interview", title: "Interview", jobIds: ["job-4"] },
    "offer": { id: "offer", title: "Offer", jobIds: ["job-5"] },
    "rejected": { id: "rejected", title: "Rejected", jobIds: ["job-6"] },
  },
  columnOrder: ["applied", "phone-screen", "interview", "offer", "rejected"],
};

export default function HomeView() {
  const [data, setData] = useState<BoardData>(initialData);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const onDragEnd = (result: DropResult) => {
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
      setData({
        ...data,
        columns: { ...data.columns, [newColumn.id]: newColumn },
      });
      return;
    }

    // Moving between columns
    const startJobIds = Array.from(startColumn.jobIds);
    startJobIds.splice(source.index, 1);
    const newStart = { ...startColumn, jobIds: startJobIds };

    const finishJobIds = Array.from(finishColumn.jobIds);
    finishJobIds.splice(destination.index, 0, draggableId);

    // Update job status to match the column
    const updatedJob = { ...data.jobs[draggableId], status: finishColumn.id };
    
    const newFinish = { ...finishColumn, jobIds: finishJobIds };

    setData({
      ...data,
      jobs: {
        ...data.jobs,
        [updatedJob.id]: updatedJob,
      },
      columns: {
        ...data.columns,
        [newStart.id]: newStart,
        [newFinish.id]: newFinish,
      },
    });
  };

  if (!isMounted) return <div className="p-8"><div className="animate-pulse h-12 w-48 bg-neutral-200 dark:bg-neutral-800 rounded mb-8"></div></div>;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-4 md:p-8 w-full bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 overflow-hidden">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1 text-neutral-900 dark:text-white">Job Applications</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">Track your interviews and application progress seamlessly.</p>
        </div>
        <Button variant="default" className="shadow-sm font-semibold rounded-full px-6">
          Add New Application
        </Button>
      </div>

      <Dialog open={!!selectedJob} onOpenChange={(open) => !open && setSelectedJob(null)}>
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 h-full overflow-x-auto pb-4" style={{ WebkitOverflowScrolling: 'touch' }}>
            {data.columnOrder.map((columnId) => {
              const column = data.columns[columnId];
              const jobs = column.jobIds.map((jobId) => data.jobs[jobId]);

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
                        className={`flex-1 overflow-y-auto pr-1 min-h-[150px] transition-colors rounded-xl p-1 -m-1 ${snapshot.isDraggingOver ? 'bg-neutral-200 dark:bg-neutral-800/80' : ''}`}
                        style={{
                           scrollbarWidth: 'none',
                           msOverflowStyle: 'none'
                        }}
                      >
                        {jobs.map((job, index) => (
                          <Draggable key={job.id} draggableId={job.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`mb-3 outline-none ${snapshot.isDragging ? 'opacity-90 scale-[1.03] rotate-2 shadow-2xl z-50' : ''}`}
                                onClick={() => setSelectedJob(job)}
                                style={{
                                  ...provided.draggableProps.style,
                                }}
                              >
                                <Card className="cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-600 transition-all overflow-hidden relative group bg-white dark:bg-[#121212] border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md rounded-xl">
                                  <div className={`absolute top-0 left-0 w-1 h-full ${job.logoColor}`} />
                                  <CardHeader className="p-4 pb-0">
                                    <div className="flex justify-between items-start gap-2">
                                      <div className="flex gap-3 items-center">
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm ${job.logoColor} shadow-inner`}>
                                          {job.company.substring(0, 1)}
                                        </div>
                                        <div className="flex flex-col">
                                          <CardTitle className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100 leading-tight">{job.company}</CardTitle>
                                          <CardDescription className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate max-w-[170px] font-medium">{job.role}</CardDescription>
                                        </div>
                                      </div>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="p-4 pt-3">
                                    <div className="flex items-center text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-2">
                                      <CalendarIcon className="w-3.5 h-3.5 mr-1.5 opacity-80" />
                                      {job.dateApplied}
                                    </div>
                                    <div className="mt-2.5 flex gap-1.5 overflow-hidden flex-wrap">
                                      <Badge variant="outline" className="border-neutral-200 dark:border-neutral-800 text-neutral-500 bg-neutral-50 dark:bg-neutral-900/50 text-[10px] uppercase font-semibold tracking-wider whitespace-nowrap truncate max-w-[130px] rounded-md shadow-sm">
                                        {job.location.split(',')[0]}
                                      </Badge>
                                      {job.status === "applied" && <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-none text-[10px] uppercase font-semibold tracking-wider rounded-md">Applied</Badge>}
                                      {job.status === "phone-screen" && <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-none text-[10px] uppercase font-semibold tracking-wider rounded-md">Screening</Badge>}
                                      {job.status === "interview" && <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-none text-[10px] uppercase font-semibold tracking-wider rounded-md">Interview</Badge>}
                                      {job.status === "offer" && <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none text-[10px] uppercase font-semibold tracking-wider rounded-md">Offer</Badge>}
                                      {job.status === "rejected" && <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-none text-[10px] uppercase font-semibold tracking-wider rounded-md">Rejected</Badge>}
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

        <DialogContent className="sm:max-w-[550px] gap-0 p-0 overflow-hidden bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-2xl">
          {selectedJob && (
            <div className="flex flex-col relative w-full pt-16 mt-6">
              <div className={`absolute top-0 left-0 w-full h-32 ${selectedJob.logoColor} opacity-90 transition-all`} style={{ zIndex: 0 }} />
              <div className="px-6 pb-6 relative" style={{ zIndex: 10 }}>
                <div className={`w-20 h-20 rounded-[1.25rem] flex items-center justify-center text-white font-bold text-3xl shadow-xl border-[6px] border-white dark:border-neutral-950 ${selectedJob.logoColor}`}>
                  {selectedJob.company.substring(0, 1)}
                </div>
                
                <div className="mt-4 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div className="flex flex-col">
                    <h2 className="text-[28px] font-bold tracking-tight text-neutral-900 dark:text-white leading-none mb-1.5">{selectedJob.company}</h2>
                    <p className="text-[17px] text-neutral-600 dark:text-neutral-400 font-medium">{selectedJob.role}</p>
                  </div>
                  <div>
                    <Badge className="font-semibold shadow-sm text-[12px] px-3.5 py-1.5 uppercase tracking-wider border border-neutral-200 dark:border-neutral-800 rounded-full">
                      {data.columns[selectedJob.status]?.title || selectedJob.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-6">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/80">
                    <div className="bg-white dark:bg-neutral-800 p-2 rounded-lg shadow-sm border border-neutral-100 dark:border-neutral-700/50">
                      <BuildingIcon className="w-[18px] h-[18px] text-neutral-600 dark:text-neutral-400" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-500">Location</p>
                      <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-200 truncate">{selectedJob.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/80">
                    <div className="bg-white dark:bg-neutral-800 p-2 rounded-lg shadow-sm border border-neutral-100 dark:border-neutral-700/50">
                      <CalendarIcon className="w-[18px] h-[18px] text-neutral-600 dark:text-neutral-400" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-500">Date Applied</p>
                      <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-200 truncate">{selectedJob.dateApplied}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-[12px] font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-400 mb-3 flex items-center gap-2">
                    Job Description
                  </h3>
                  <div className="text-[14px] text-neutral-600 dark:text-neutral-300 leading-relaxed bg-neutral-50 dark:bg-neutral-900/40 p-4.5 rounded-xl border border-neutral-100 dark:border-neutral-800/60 shadow-sm p-4">
                    {selectedJob.description}
                  </div>
                </div>

                <div className="mt-6 shadow-md rounded-xl overflow-hidden border border-indigo-100 dark:border-indigo-900/60 relative">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
                  <div className="bg-indigo-50/80 dark:bg-[#12142B] p-5 pl-6">
                    <h3 className="text-[12px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 mb-2.5 flex items-center gap-2">
                      <BrainCircuit className="w-[18px] h-[18px] text-indigo-500" /> AI Application Insights
                    </h3>
                    <p className="text-[14px] text-indigo-900 dark:text-indigo-200 leading-relaxed font-medium">
                      "{selectedJob.aiFeedback}"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
