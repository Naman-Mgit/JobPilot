"use server";

import clientPromise from "@/lib/mongodb";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";

function getLogoColor(company: string) {
  const colors = [
    "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-green-500", 
    "bg-emerald-500", "bg-teal-500", "bg-cyan-500", "bg-blue-500", 
    "bg-indigo-500", "bg-violet-500", "bg-purple-500", "bg-fuchsia-500", "bg-pink-500", "bg-rose-500", "bg-neutral-800"
  ];
  let hash = 0;
  for (let i = 0; i < company.length; i++) {
    hash = company.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

async function getSessionUserId() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function getJobs() {
  try {
    const userId = await getSessionUserId();
    const client = await clientPromise;
    const db = client.db();
    
    const jobs = await db.collection("jobs").find({ userId }).toArray();
    return jobs.map(j => ({
      ...j,
      _id: j._id.toString()
    }));
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return [];
  }
}

export async function createJob(data: any) {
  try {
    const userId = await getSessionUserId();
    const client = await clientPromise;
    const db = client.db();
    
    // Default location since user didn't specify it in fields but it was used in UI
    const location = "Remote"; 
    // Default mock AI feedback for new jobs
    const aiFeedback = "Keep an eye on their recent funding rounds to bring up in interviews!";
    
    const newJob = {
      userId,
      company: data.company,
      role: data.role,
      jdLink: data.jdLink || "",
      notes: data.notes || "",
      dateApplied: data.dateApplied || new Date().toISOString().split('T')[0],
      status: data.status || "applied",
      salary: data.salary || "",
      location,
      aiFeedback,
      description: data.notes || "No description provided.",
      logoColor: getLogoColor(data.company),
      createdAt: new Date()
    };

    const result = await db.collection("jobs").insertOne(newJob);
    
    revalidatePath("/");
    
    return {
      success: true,
      job: { ...newJob, _id: result.insertedId.toString() }
    };
  } catch (error: any) {
    console.error("Error creating job:", error);
    return { success: false, error: error.message };
  }
}

export async function updateJob(id: string, data: any) {
  try {
    const userId = await getSessionUserId();
    const client = await clientPromise;
    const db = client.db();
    
    const updateData = {
      company: data.company,
      role: data.role,
      jdLink: data.jdLink || "",
      notes: data.notes || "",
      dateApplied: data.dateApplied,
      status: data.status,
      salary: data.salary || "",
      description: data.notes || "No description provided.",
      // Optionally update logo color if company changed
      ...(data.company ? { logoColor: getLogoColor(data.company) } : {})
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => updateData[key as keyof typeof updateData] === undefined && delete updateData[key as keyof typeof updateData]);

    await db.collection("jobs").updateOne(
      { _id: new ObjectId(id), userId }, // extra safety
      { $set: updateData }
    );
    
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating job:", error);
    return { success: false, error: error.message };
  }
}

export async function updateJobStatus(id: string, newStatus: string) {
  try {
    const userId = await getSessionUserId();
    const client = await clientPromise;
    const db = client.db();
    
    await db.collection("jobs").updateOne(
      { _id: new ObjectId(id), userId },
      { $set: { status: newStatus } }
    );
    
    // We don't revalidate path here strictly because the drag and drop already assumes optimistic UI update
    return { success: true };
  } catch (error: any) {
    console.error("Error updating status:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteJob(id: string) {
  try {
    const userId = await getSessionUserId();
    const client = await clientPromise;
    const db = client.db();
    
    await db.collection("jobs").deleteOne({ _id: new ObjectId(id), userId });
    
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting job:", error);
    return { success: false, error: error.message };
  }
}
