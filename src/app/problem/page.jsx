"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchProblems, fetchTags } from "../../redux/slices/problemSlice";
import {
  fetchAllPlaylists,
  createPlaylist,
  addProblemToPlaylist
} from "../../redux/slices/playlistSlice";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "../../context/authContext";
import { useRouter } from "next/navigation";


export default function ProblemsList() {
  const dispatch = useDispatch();
    const { isAuthenticated, loading: authLoading } = useAuth();
const router = useRouter();
  
  const { items: problems, status, tags, error } = useSelector(
    (state) => state.problem
  );
  const { playlists = [], loading: playlistLoading = false } = useSelector(
    (state) => state.playlists || {}
  );

  const [selectedProblem, setSelectedProblem] = useState(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [newPlaylist, setNewPlaylist] = useState({
    title: "",
    description: ""
  });



  const [selectedPlaylistId, setSelectedPlaylistId] = useState("");

  const [difficultyFilter, setDifficultyFilter] = useState({
    EASY: false,
    MEDIUM: false,
    HARD: false,
  });

  const [statusFilter, setStatusFilter] = useState({
    Solved: false,
    Unsolved: false,
  });

  const [difficultyTouched, setDifficultyTouched] = useState(false);
  const [statusTouched, setStatusTouched] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (status === "idle") dispatch(fetchProblems());
    dispatch(fetchTags());
    dispatch(fetchAllPlaylists());
  }, [status, dispatch]);

  const handleCreatePlaylist = async () => {
    if (!newPlaylist.title.trim() || !selectedProblem) return;
    if (!authLoading && !isAuthenticated) {
      toast("You must be logged in to view Create Playlist");
      router.push("/login");
    }

    const result = await dispatch(createPlaylist(newPlaylist));
    if (result.payload?._id) {
      // Add the problem to the newly created playlist
      await dispatch(addProblemToPlaylist({
        playlistId: result.payload._id,
        problemId: selectedProblem._id
      }));
    }
    setOpen(false);

    setNewPlaylist({ title: "", description: "" });
    setIsCreateMode(false);
    setSelectedProblem(null);
  };

  const handleAddToPlaylist = async () => {
    if (!selectedPlaylistId || !selectedProblem) return;
     if (!authLoading && !isAuthenticated) {
    toast("You must be logged in to view Create Playlist");
    router.push("/login");
  }

    await dispatch(addProblemToPlaylist({
      playlistId: selectedPlaylistId,
      problemId: selectedProblem._id
    }));
    toast("Problem added to playlist");


    setSelectedProblem(null);
    setOpen(false);
    setSelectedPlaylistId("");
  };

 

  const getBadgeColor = (difficulty) => {
    switch (difficulty) {
      case "EASY":
        return "bg-green-200 text-green-800";
      case "MEDIUM":
        return "bg-yellow-200 text-yellow-800";
      case "HARD":
        return "bg-red-200 text-red-800";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  const filteredProblems = useMemo(() => {
    const noDifficultySelected = Object.values(difficultyFilter).every(
      (v) => !v
    );
    const noStatusSelected = Object.values(statusFilter).every((v) => !v);

    if (noDifficultySelected && noStatusSelected) {
      return problems;
    }

    return problems?.filter((problem) => {
      const isDifficultyMatch =
        noDifficultySelected || difficultyFilter[problem.difficulty];
      const isStatusMatch =
        noStatusSelected || statusFilter["Unsolved"]; // Update this logic if needed
      return isDifficultyMatch && isStatusMatch;
    });
  }, [problems, difficultyFilter, statusFilter]);
   const [isFixed, setIsFixed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Adjust 200 to the scroll distance where you want it to become fixed
      if (window.scrollY > 10) {
        setIsFixed(true);
      } else {
        setIsFixed(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="flex flex-col min-h-screen max-w-7xl mx-auto">
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`${
            isFixed
              ? "fixed top-0 left-0 md:w-30 w-full h-full z-60 overflow-y-auto  p-4"
              : "relative md:w-40 w-full p-4"
          }`}
    >
  <h2 className="text-lg font-semibold mb-4">Filters</h2>
  <div className="mb-6">
    <p className="font-medium mb-2">Difficulty</p>
    {["EASY", "MEDIUM", "HARD"].map((level) => (
      <label
        key={level}
        className="flex items-center space-x-2 mb-1 cursor-pointer select-none"
      >
        <Checkbox
          checked={difficultyFilter[level]}
          onCheckedChange={() => {
            setDifficultyTouched(true);
            setDifficultyFilter((prev) => ({
              ...prev,
              [level]: !prev[level],
            }));
          }}
        />
        <span>{level}</span>
      </label>
    ))}
  </div>
</aside>


        {/* Main Content */}
        <main className={`overflow-y-auto p-4 md:p-6 transition-all duration-300 ${
    isFixed ? " ml-40  w-full" : "w-full md:w-[calc(100%-10rem)]"
  }`}>
          {/* Loading Skeleton */}
          {status === "loading" && (
            <div className="space-y-4">
              {[...Array(10)].map((_, rowIdx) => (
                <div
                  key={rowIdx}
                  className="flex flex-col md:grid md:grid-cols-5 gap-4 py-2 border-b border-gray-200"
                >
                  <Skeleton className="h-6 w-full col-span-2" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ))}
            </div>
          )}

          {/* Error Message */}
          {status === "failed" && (
            <p className="text-red-600 text-center">{error}</p>
          )}

          {/* Problems Display */}
          {status === "succeeded" && (
            <>
              {filteredProblems?.length === 0 ? (
                <p className="text-gray-500 text-center mt-8">
                  No matching problems found.
                </p>
              ) : (
                <>
                  {/* For larger screens, keep table */}
                  <div className="hidden md:block">
                    <Table className="mt-4">
                     
                      <TableHeader>
                        <TableRow>
                          <TableHead>Problem</TableHead>
                          <TableHead>Difficulty</TableHead>
                          
                          <TableHead>Add to Sheets</TableHead>
                          <TableHead>Solve</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProblems.map((problem) => (
                          <TableRow key={problem._id}>
                            <TableCell className="font-medium">
                              {problem.title}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`text-sm font-medium px-2 py-1 rounded ${getBadgeColor(
                                  problem.difficulty
                                )}`}
                              >
                                {problem.difficulty}
                              </span>
                            </TableCell>
                          
                            <TableCell>
                              <div className="flex gap-2">
                                <Dialog open={open} onOpenChange={setOpen } className="w-full bg-white">
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedProblem(problem);
                                        setOpen(true);
                                      }}
                                    >
                                      Add to Playlist
                                    </Button>
                                  </DialogTrigger>
                                        <DialogOverlay className="fixed inset-0 bg-white/70 backdrop-blur-sm z-40" />
                                  <DialogContent  className="bg-white [&>div[data-radix-dialog-overlay]]:bg-white/70 [&>div[data-radix-dialog-overlay]]:backdrop-blur-sm [&>div[data-radix-dialog-overlay]]:z-40" >
                                    <DialogHeader>
                                      <DialogTitle>Add to Playlist</DialogTitle>
                                      <DialogDescription>
                                        Add "{selectedProblem?.title}" to an existing playlist or create a new one.
                                      </DialogDescription>
                                    </DialogHeader>

                                    {!isCreateMode ? (
                                      <>
                                        <div className="space-y-4 py-4">
                                          <div className="space-y-2">
                                            <Label>Select Playlist</Label>
                                            <select
                                              className="w-full p-2 border rounded-md"
                                              value={selectedPlaylistId}
                                              onChange={(e) => setSelectedPlaylistId(e.target.value)}
                                            >
                                              <option value="">Select a playlist...</option>
                                              {playlists.map((item) => (
                                                <option key={item?.playlist?._id} value={item?.playlist?._id}>
                                                  {item?.playlist?.title}
                                                </option>
                                              ))}
                                            </select>
                                          </div>
                                          <Button type="button" variant="outline" onClick={() => setIsCreateMode(true)}>
                                            Create New Playlist
                                          </Button>
                                        </div>
                                        <DialogFooter>
                                          <Button type="button" onClick={handleAddToPlaylist} disabled={!selectedPlaylistId}>
                                            Add to Playlist
                                          </Button>
                                        </DialogFooter>
                                      </>
                                    ) : (
                                      <>
                                        <div className="space-y-4 py-4">
                                          <div className="space-y-2">
                                            <Label>Playlist Title</Label>
                                            <Input
                                              value={newPlaylist.title}
                                              onChange={(e) =>
                                                setNewPlaylist((prev) => ({ ...prev, title: e.target.value }))
                                              }
                                              placeholder="Enter playlist title"
                                            />
                                          </div>
                                          <div className="space-y-2">
                                            <Label>Description</Label>
                                            <Textarea
                                              value={newPlaylist.description}
                                              onChange={(e) =>
                                                setNewPlaylist((prev) => ({ ...prev, description: e.target.value }))
                                              }
                                              placeholder="Enter playlist description"
                                            />
                                          </div>
                                        </div>
                                        <DialogFooter>
                                          <Button type="button" variant="outline" onClick={() => setIsCreateMode(false)}>
                                            Back
                                          </Button>
                                          <Button
                                            type="button"
                                            onClick={handleCreatePlaylist}
                                            disabled={!newPlaylist.title.trim()}
                                          >
                                            Create & Add
                                          </Button>
                                        </DialogFooter>
                                      </>
                                    )}
                                  </DialogContent>
                                </Dialog>


                              </div>
                            </TableCell>
                            <TableCell>
                              <Button asChild size="sm">
                                <a
                                  href={`/problem/${problem._id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Solve
                                </a>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile & small screen view - card list */}
                  <div className="md:hidden space-y-4">
                    {filteredProblems.map((problem) => (
                      <div
                        key={problem._id}
                        className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md"
                      >
                        <h3 className="text-lg font-semibold mb-1">
                          {problem.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded ${getBadgeColor(
                              problem.difficulty
                            )}`}
                          >
                            {problem.difficulty}
                          </span>
                          <Badge variant="outline">Unsolved</Badge>
                        </div>

                        <div className="flex space-x-2">

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="flex-1"
                                onClick={() => setSelectedProblem(problem)}
                              >
                                Add to Playlist
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add to Playlist</DialogTitle>
                                <DialogDescription>
                                  Add "{problem.title}" to an existing playlist or create a new one.
                                </DialogDescription>
                              </DialogHeader>

                              {!isCreateMode ? (
                                <>
                                  <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                      <Label>Select Playlist</Label>
                                      <select
                                        className="w-full p-2 border rounded-md"
                                        value={selectedPlaylistId}
                                        onChange={(e) => setSelectedPlaylistId(e.target.value)}
                                      >
                                        <option value="">Select a playlist...</option>
                                        {playlists.map((playlist) => (
                                          <option key={playlist._id} value={playlist._id}>
                                            {playlist.title}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => setIsCreateMode(true)}
                                    >
                                      Create New Playlist
                                    </Button>
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      type="button"
                                      onClick={handleAddToPlaylist}
                                      disabled={!selectedPlaylistId}
                                    >
                                      Add to Playlist
                                    </Button>
                                  </DialogFooter>
                                </>
                              ) : (
                                <>
                                  <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                      <Label>Playlist Title</Label>
                                      <Input
                                        value={newPlaylist.title}
                                        onChange={(e) => setNewPlaylist(prev => ({
                                          ...prev,
                                          title: e.target.value
                                        }))}
                                        placeholder="Enter playlist title"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Description</Label>
                                      <Textarea
                                        value={newPlaylist.description}
                                        onChange={(e) => setNewPlaylist(prev => ({
                                          ...prev,
                                          description: e.target.value
                                        }))}
                                        placeholder="Enter playlist description"
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => setIsCreateMode(false)}
                                    >
                                      Back
                                    </Button>
                                    <Button
                                      type="button"
                                      onClick={handleCreatePlaylist}
                                      disabled={!newPlaylist.title.trim()}
                                    >
                                      Create & Add
                                    </Button>
                                  </DialogFooter>
                                </>
                              )}
                            </DialogContent>
                          </Dialog>
                          <Button asChild size="sm" className="flex-1">
                            <a
                              href={`/problem/${problem._id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Solve
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
