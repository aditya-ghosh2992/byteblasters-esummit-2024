"use client"
import { useToast } from "@/hooks/use-toast";
import { Message, User } from "@/model/user";
import { acceptMsgSchema } from "@/schemas/acceptMsgSchema";
import { useSession } from "next-auth/react";
import React, { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { AxiosError } from "axios";
import { ApiResponse } from "@/types/ApiResponse";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCcw } from "lucide-react";
import MessageCard from "@/components/messageCard";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

export default function Dashboard() {
    const [messages , setMessages] = useState<Message[]>([])
    const [isLoading , setIsLoading] = useState<boolean>(false) // messages fetching
    const [isSwitchLoading , setIsSwitchLoading] = useState<boolean>(false) // state changing of the button
    const {toast} = useToast()
    //optimistic UI approach

    const handleDeleteMessage = (messageId : string) => {
        setMessages(messages.filter((message) => message._id !== messageId))
    }
    const {data:session} = useSession()
    const form = useForm({
        resolver: zodResolver(acceptMsgSchema),
    })

    const {register , watch , setValue} = form;
    const acceptMessages = watch("acceptMessages")
    
    const fetchAcceptMessage = useCallback(async() => {
        setIsSwitchLoading(true)
        try {
           const response = await axios.get<ApiResponse>('/api/accepting-messages')
           setValue("acceptMessages" , response.data.isAcceptMessage)

        } catch (error) {
           const axiosError = error as AxiosError<ApiResponse>;
           toast({
            title : "Error",
            description : axiosError.response?.data.message || "Failed to fetch messages",
            variant : "destructive"
           })
        }
        finally{
            setIsSwitchLoading(false)
        }
    }, [setValue])

    const fetchMessages = useCallback(async( refresh: boolean = false) => {
        setIsLoading(true)
        setIsSwitchLoading(false)
        try {
            const response = await axios.get<ApiResponse>('/api/get-messages')
            setMessages(response.data.messages || [])
            if(refresh){
                toast({
                    title : "Refershed messages",
                    description : "Showing latest messages",
                })
            }
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>;
            console.log(error , axiosError.response?.data.message)
           toast({
            title : "Error",
            description : axiosError.response?.data.message || "Failed to fetch messages",
            variant : "destructive"
           })
        }
        finally{
            setIsSwitchLoading(false)
            setIsLoading(false)
        }
    },[setIsLoading , setIsSwitchLoading ])

    useEffect(() => {
        if(!session || !session?.user) {
          toast({
            title : "Error yahi se araha",
            variant : "destructive"
           });
          return;
        }
        fetchMessages();
        fetchAcceptMessage();
        },[session, setValue,toast, fetchAcceptMessage , fetchMessages])
    
    //handle Switch change

    const handleSwitchChange = async() => {
        try {
        const response = await axios.post<ApiResponse>(`/api/accepting-messages` , {isAcceptMessage : !acceptMessages})
        setValue("acceptMessages" , !acceptMessages)
        toast({
            title : response.data.message,
            variant : "default"
        });
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>;
            toast({
             title : "Error",
             description : axiosError.response?.data.message || "Failed to fetch messages",
             variant : "destructive"
            })
        }
    }

    const username = session?.user.username || ""; // Adjust to match the actual property name, e.g., session?.user?.username

    // Check if username exists
if (!username) {
    console.warn("Username is not available");
}
else{
    console.log(username);
  }

// Construct the profile URL
const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'; 
const profileUrl = username ? `${baseUrl}/u/${username}` : baseUrl; //
    const copyToClipboard = () => {
        navigator.clipboard.writeText(profileUrl)
        
        toast({
            title : "Copied to clipboard",
            description : "Profile URL copied to clipboard",
            variant : "default"
        })
    }
    
    if(!session || !session.user){
        return (
            <div>
                <h1>Please sign in</h1>
            </div>
        )
    }
    return(
       <>
        <div className="my-8 mx-4 md:mx-8 lg:mx-auto p-6 bg-white rounded w-full max-w-6xl">
      <h1 className="text-4xl font-bold mb-4">User Dashboard</h1>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Copy Your Unique Link</h2>{' '}
        <div className="flex items-center">
          <input
            type="text"
            value={profileUrl}
            disabled
            className="input input-bordered w-full p-2 mr-2"
          />
          <Button onClick={copyToClipboard}>Copy</Button>
        </div>
      </div>

      <div className="mb-4">
        <Switch
          {...register('acceptMessages')}
          checked={acceptMessages}
          onCheckedChange={handleSwitchChange}
          disabled={isSwitchLoading}
        />
        <span className="ml-2">
          Accept Messages: {acceptMessages ? 'On' : 'Off'}
        </span>
      </div>
      <Separator />

      <Button
        className="mt-4"
        variant="outline"
        onClick={(e) => {
          e.preventDefault();
          fetchMessages(true);
        }}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCcw className="h-4 w-4" />
        )}
      </Button>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        {messages.length > 0 ? (
          messages.map((message, index) => (
            <MessageCard
              key={message._id as string || index}
              message={message}
              onMessageDelete={handleDeleteMessage}
            />
          ))
        ) : (
          <p>No messages to display.</p>
        )}
      </div>
    </div>
       </>
    )
}