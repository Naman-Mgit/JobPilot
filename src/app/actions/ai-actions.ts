"use server";

import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function parseJobDescription(jdText: string) {
  try {
    // Enforce auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) return { success: false, error: "Unauthorized" };

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return { success: false, error: "API Key Missing: Please provide GOOGLE_GENERATIVE_AI_API_KEY in your .env file!" };
    }

    const result = await generateObject({
      model: google('gemini-2.5-flash'), // extremely fast & accurate for this task
      prompt: `You are an expert Job Description parser logic unit. Analyze the following JD and return purely structured JSON according to the schema. If something is completely unclear or missing, infer safely or use 'Unknown'.\n\nJOB DESCRIPTION:\n${jdText}`,
      schema: z.object({
        companyName: z.string().describe("The name of the company hiring."),
        role: z.string().describe("The exact job title or role name."),
        location: z.string().describe("The location of the job, e.g., 'San Francisco, CA', 'Remote', 'Hybrid'."),
        seniority: z.string().describe("Seniority level. E.g. 'Junior', 'Mid-Level', 'Senior', 'Staff'."),
        requiredSkills: z.array(z.string()).describe("A concise list of 4-7 absolutely required technical/core skills."),
        niceToHaveSkills: z.array(z.string()).describe("A list of bonus or preferred skills."),
      }),
    });

    return { success: true, data: result.object };
  } catch (error: any) {
    console.error("AI Parse Error:", error);
    return { success: false, error: error.message || "Failed to parse JD. Is your Gemini API Key valid?" };
  }
}

export async function generateResumeSuggestions(jdText: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) return { success: false, error: "Unauthorized" };

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return { success: false, error: "API Key Missing: Please provide GOOGLE_GENERATIVE_AI_API_KEY in your .env file!" };
    }

    const result = await generateObject({
      model: google('gemini-2.5-flash'),
      prompt: `You are an expert career coach and resume writer. Read the following Job Description and generate 3 to 5 highly tailored, specific, and impactful resume bullet points that a candidate could use. Do NOT use generic language. Use strong action verbs and relate directly to the technologies or methodologies mentioned in the JD.\n\nJOB DESCRIPTION:\n${jdText}`,
      schema: z.object({
        bulletPoints: z.array(z.string()).min(3).max(5).describe("An array of 3 to 5 finely crafted resume bullet points (without the actual bullet symbol)."),
      }),
    });

    return { success: true, data: result.object.bulletPoints };
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return { success: false, error: error.message || "Failed to generate suggestions. Is your Google Gemini API Key valid?" };
  }
}
