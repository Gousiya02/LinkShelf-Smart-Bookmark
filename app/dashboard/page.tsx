"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

interface Bookmark {
  id: string;
  title: string;
  url: string;
}

export default function Dashboard() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const router = useRouter();

  const fetchBookmarks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/");
      return;
    }

    const { data } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setBookmarks(data);
  };

  const addBookmark = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !title || !url) return;

    await supabase.from("bookmarks").insert([
      { title, url, user_id: user.id },
    ]);

    setTitle("");
    setUrl("");
  };

  const deleteBookmark = async (id: string) => {
    await supabase.from("bookmarks").delete().eq("id", id);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  useEffect(() => {
    fetchBookmarks();

    const channel = supabase
      .channel("realtime-bookmarks")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmarks",
        },
        () => {
          fetchBookmarks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden text-white p-10">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=2670&auto=format&fit=crop"
          alt="Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-blue-800/40 backdrop-blur-sm"></div>
      </div>

      <div className="relative z-10">
        {/* Logout Button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={logout}
            className="bg-blue-900 border border-black text-white px-5 py-2 rounded-md hover:bg-white/80 hover:text-blue-900 transition backdrop-blur-sm"
          >
            Logout
          </button>
        </div>

        {/* Main Heading */}
        <h1 className="text-center text-6xl font-bold mb-14 tracking-widest text-white shadow-sm">
          BOOKMARKS
        </h1>

        {/* Add Bookmark */}
        <div className="flex justify-center gap-4 mb-12">
          <input
            className="bg-white/10 border border-white/20 text-white placeholder-blue-200 p-3 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition backdrop-blur-md"
            placeholder="Bookmark Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className="bg-white/10 border border-white/20 text-white placeholder-blue-200 p-3 rounded-md w-80 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition backdrop-blur-md"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            onClick={addBookmark}
            className="bg-white text-blue-900 font-bold px-6 py-3 rounded-md hover:bg-green-600 hover:text-white transition shadow-lg hover:shadow-xl"
          >
            Add
          </button>
        </div>

        {/* Bookmark List */}
        <div className="max-w-2xl mx-auto space-y-5">
          {bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="flex items-center gap-4"
            >
              {/* Left - Bookmark Link as Button */}
              <a
                href={bookmark.url}
                target="_blank"
                className="flex-grow bg-white/10 border border-white/20 shadow-lg p-4 rounded-xl text-2xl font-medium hover:bg-white/20 hover:border-white/40 transition text-center block text-white backdrop-blur-md"
              >
                {bookmark.title}
              </a>

              {/* Right - Delete Button */}
              <button
                onClick={() => deleteBookmark(bookmark.id)}
                className="bg-red-500/80 border border-red-400/50 text-white px-5 py-3 text-base rounded-xl hover:bg-red-600 transition h-fit whitespace-nowrap shadow-md backdrop-blur-sm"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
