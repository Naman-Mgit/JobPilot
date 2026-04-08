"use client"

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function Home() {
  const {data:session}=authClient.useSession();
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");

  const onSubmit=async()=>{
     await authClient.signUp.email({
        email,
        name,
        password
     },{
       onError:()=>{window.alert("Something went wrong")},
       onSuccess:()=>{window.alert("Success")},
     })
  }
  const onLogin=async()=>{
     await authClient.signIn.email({
        email,
        password
     },{
       onError:()=>{window.alert("Something went wrong")},
       onSuccess:()=>{window.alert("Success")},
     })
  }

  if(session){
     return(
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
           <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
             <h1 className="text-2xl font-bold text-gray-800 mb-4">Welcome!</h1>
             <p className="text-lg text-gray-600 mb-6">You are logged in as <span className="font-semibold text-blue-600">{session.user.name}</span></p>
             <button 
               onClick={()=>authClient.signOut()}
               className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
             >
               Logout
             </button>
           </div>
        </div>
     )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8">
      {/* Sign Up Form */}
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Create Account</h2>
        <div className="space-y-4">
          <input 
            placeholder="Full Name" 
            value={name} 
            onChange={(e)=>setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input 
            placeholder="Email Address" 
            value={email} 
            onChange={(e)=>setEmail(e.target.value)}
            type="email"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input 
            placeholder="Password" 
            value={password} 
            onChange={(e)=>setPassword(e.target.value)}
            type="password"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button 
            onClick={onSubmit}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 mt-6"
          >
            Create Account
          </button>
        </div>
      </div>

      {/* Sign In Form */}
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Sign In</h2>
        <div className="space-y-4">
          <input 
            placeholder="Email Address" 
            value={email} 
            onChange={(e)=>setEmail(e.target.value)}
            type="email"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
          <input 
            placeholder="Password" 
            value={password} 
            onChange={(e)=>setPassword(e.target.value)}
            type="password"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
          <button 
            onClick={onLogin}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 mt-6"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
