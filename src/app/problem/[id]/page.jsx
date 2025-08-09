'use client';

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProblemsById,
  runCode,
  submitCode,
  clearRunResult,
  clearSubmitResult,
  fetchAllSubmission,
} from "../../../redux/slices/problemSlice";
import { fetchComments } from "../../../redux/slices/commentsSlice";
import { useParams, useRouter } from "next/navigation";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import CodeEditor from "../../../Component/CodeEditer";
import { Skeleton } from "@/components/ui/skeleton";
import CommentSection from "../../../Component/Commnets";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from '@/context/authContext';

function markdownToHtml(md) {
  return md
    ?.replace(/``````/g, '<pre class="bg-muted p-2 rounded"><code>$1</code></pre>')
    .replace(/\n/g, "<br/>");
}

function copyToClipboard(value) {
  if (navigator?.clipboard) {
    navigator.clipboard.writeText(value);
    toast("Copied to clipboard");
  }
}

function getMonacoLanguage(lang) {
  switch (lang.toUpperCase()) {
    case "PYTHON":
      return "python";
    case "C++":
    case "CPP":
      return "cpp";
    default:
      return "plaintext";
  }
}

function getLanguageId(lang) {
  switch (lang.toUpperCase()) {
    case "PYTHON":
      return 71;
    case "CPP":
    case "C++":
      return 54;
    default:
      return 0;
  }
}
// utils/getDefaultLanguage.js or top of your component file
function getDefaultLanguage(problem, availableLangs) {
  if (!problem) return "C++";
  const codes = Object.keys(problem?.codeSnippets || {}).map((l) =>
    l.toUpperCase()
  );
  const firstAvailableLang = availableLangs.find((l) => codes.includes(l));
  return firstAvailableLang || "C++";
}


export default function ProblemDetailsPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const {
    getById: problem,
    status,
    error,
    runStatus,
    runResult,
    runError,
    submitStatus,
    submitResult,
    submitResultId,
    submitResulStatus,
    submitError,
  } = useSelector((state) => state.problem);
  
      const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();


    const { comments, loading } = useSelector((state) => state.comments);
  const availableLangs = ["C++", "PYTHON"];
  const [tabs,setTabs]=useState("testcases");
 const [selectedCode, setSelectedCode] = useState("testcases");
  const [rightTab, setRightTab] = useState("problem");
  const [lang, setLang] = useState(() => {
    if (!problem) return "C++";
    const codes = Object.keys(problem?.codeSnippets || {}).map((l) =>
      l.toUpperCase()
    );
    const firstAvailableLang = availableLangs.find((l) => codes.includes(l));
    return firstAvailableLang || "C++";
  });
// you can pass this as a prop too

  const [sourceCode, setSourceCode] = useState("");
  const [hasRunProblem, setHasRunProblem] = useState(false);

const [solutionLang, setSolutionLang] = useState(() => getDefaultLanguage(problem, availableLangs));
  useEffect(() => {
  if (id) {
    dispatch(fetchProblemsById(id));
    dispatch(fetchComments(id));
  }

  // Disable body scroll when mounted
  document.body.style.overflow = "hidden";

  return () => {
    document.body.style.overflow = "auto";
  };
}, [id, dispatch]);

useEffect(() => {
  dispatch(fetchAllSubmission());
}, [dispatch]);

useEffect(() => {
  if (!problem) return;

  // Set language if available
  if (problem.codeSnippets) {
    const codes = Object.keys(problem.codeSnippets).map((l) => l.toUpperCase());
    const firstAvailableLang = availableLangs?.find((l) => codes.includes(l));

    if (firstAvailableLang && firstAvailableLang !== lang) {
      setLang(firstAvailableLang);
    }

    const selectedLang = firstAvailableLang || lang;
    const code = problem.codeSnippets[selectedLang] || "";
    setSourceCode(code);
  }
}, [problem, lang, availableLangs]);

useEffect(() => {
  if (lang && problem?.codeSnippets) {
    const code = problem.codeSnippets[lang] || "";
    setSourceCode(code);
  }
}, [lang, problem]);

useEffect(() => {
  if (runResult) {
    setRightTab("Results");
    setHasRunProblem(true);
  }

  if (runError) {
    toast(`${runError}`);
  }
}, [runResult, runError]);



useEffect(() => {
  if (submitStatus === "succeeded") {
    toast(`Submission successful! Passed`);
  }
}, [submitStatus]);


  if (status === "loading") {
    return (
      <div className="flex w-full h-[calc(100vh-64px)] min-h-[600px] gap-8 p-8 bg-muted/60">
        <div className="w-[40%] min-w-[325px] flex flex-col gap-4">
          <Skeleton className="h-10 w-[70%] mb-2" />
          <Skeleton className="h-6 w-[90px] mb-2 rounded-xl" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-[60px] rounded"/>
            <Skeleton className="h-6 w-[60px] rounded"/>
            <Skeleton className="h-6 w-[60px] rounded"/>
          </div>
          <Skeleton className="h-24 w-full mt-3" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-28 w-full"/>
        </div>
        <div className="w-[60%] flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
          </div>
          <Skeleton className="h-[400px] w-full rounded-lg"/>
          <Skeleton className="h-24 w-full mt-4"/>
        </div>
      </div>
    );
  }

  if (status === "failed")
    return (
      <div className="p-8 text-destructive text-lg flex items-center h-full justify-center">
        {error}
      </div>
    );
  if (!problem) return null;

  const visibleCases = (problem?.testcases || []).filter((tc) => !tc.isHidden);

  function handleRun() {
    if (!sourceCode.trim()) {
      toast("Please write code before running.");
      return;
    }
     if (!authLoading && !isAuthenticated) {
      toast("You must be logged in to Solve problems");
      router.push("/login");
    }
    dispatch(clearRunResult());
    dispatch(
      runCode({
        problemId: id,
        languageId: getLanguageId(lang),
        sourceCode,
      })
    );
    setTabs("Results")
  }

  function handleSubmit() {
    if (!sourceCode.trim()) {
      toast("Please write code before submitting.");
      return;
    }
     if (!authLoading && !isAuthenticated) {
      toast("You must be logged in to view problems");
      router.push("/login");
    }
    dispatch(clearSubmitResult());
    dispatch(
      submitCode({
        problemId: id,
        languageId: getLanguageId(lang),
        sourceCode,
      })
    );
    toast("The Code is Submitted");
      setRightTab("result");
  }
 
  function onCodeChange(newCode) {
    setSourceCode(newCode);
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex w-full h-[calc(100vh-64px)] min-h-[600px] ">
        {/* LEFT SIDE */}
         <Tabs
            value={rightTab}
            onValueChange={setRightTab}
            className="flex-1 flex flex-col "
          >
         <TabsList className="w-full text-md">
              <TabsTrigger value="problem">Problem</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="solutions">Solutions</TabsTrigger>
              <TabsTrigger value="submission">Submissions</TabsTrigger>
              <TabsTrigger value="result">Result</TabsTrigger>
          </TabsList>
           
           
            <TabsContent value="problem" className="flex-1 overflow-hidden">
  <aside
    className="w-full min-w-[325px] mb-10 px-8 py-6   overflow-y-auto flex flex-col gap-4 h-[calc(100vh-5rem)]"
  >
    <div>
      <h1 className="text-3xl font-extrabold mb-2 text-primary">
        {problem?.title}
      </h1>
      <Badge
        variant={
          problem?.difficulty === "EASY"
            ? "success"
            : problem?.difficulty === "MEDIUM"
            ? "warning"
            : "destructive"
        }
        className="font-semibold tracking-wide text-sm"
      >
        {problem?.difficulty || ""}
      </Badge>
    </div>

    <div className="mb-4 flex gap-2 flex-wrap">
      {problem?.tags?.map((tag) => (
        <Badge variant="secondary" key={tag} className="text-xs">
          {tag}
        </Badge>
      ))}
    </div>

    <section
      className="prose prose-sm max-w-none"
      style={{ fontFamily:"inter" ,fontSize: 16 }}
    >
      <div
        dangerouslySetInnerHTML={{
          __html: markdownToHtml(problem?.description),
        }}
      />
    </section>

   <div className="mb-20">
        <h2 className="font-semibold ">Constraints</h2>
        <ul className="list-disc list-inside text-sm">
          {problem?.constraints?.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
        </div>
    
  </aside>
            </TabsContent>
            

            <TabsContent
  value="comments"
  className="flex-grow overflow-auto px-4 py-4  max-h-[600px]" // Adjust height as needed
>
  <CommentSection problemId={id} />
  <div className="space-y-4 mb-6 mt-6">
        {comments?.length > 0 ? (
          comments.map((c,ind) => (
            <div key={c._id ||ind } className="border border-[#e3e3e3] p-4">
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-semibold text-blue-700">
                  {c?.userId?.name || "Unknown User"}
                </p>
                <span className="text-xs text-gray-500">
                  {new Date(c.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-gray-800">{c.content}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No comments yet. Be the first to comment!</p>
        )}
      </div>
            </TabsContent>

           <TabsContent value="solutions" className="flex flex-col h-full overflow-auto ml-2 p-2">
  {hasRunProblem && (
    <Section title="Reference Solutions">
      <div className="flex gap-2 mb-4 flex-wrap">
        {availableLangs.map((l) => (
          <Button
            key={l}
            size="sm"
            variant={solutionLang === l ? "default" : "outline"}
            className="px-4"
            onClick={() => setSolutionLang(l)}
          >
            {l}
          </Button>
        ))}
      </div>

      <Card className="flex-grow overflow-auto">
        <CardContent className="p-4 relative">
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-3 right-3 opacity-80 hover:opacity-100"
            title="Copy Solution"
            tabIndex={-1}
            onClick={() =>
              copyToClipboard(
                problem?.referenceSolutions?.[solutionLang]
                  ?.replace(/int\s+main\s*\([^)]*\)\s*\{[\s\S]*?\n\}/, "")
                  ?.trim() || ""
              )
            }
          >
            <Copy className="w-4 h-4" />
          </Button>
          <pre className="text-sm leading-6 overflow-x-auto p-4 font-mono whitespace-pre-wrap">
            {problem?.referenceSolutions?.[solutionLang]
              ?.replace(/int\s+main\s*\([^)]*\)\s*\{[\s\S]*?\n\}/, "")
              ?.trim()}
          </pre>
        </CardContent>
      </Card>
    </Section>
  )}
</TabsContent>

           <TabsContent value="result" className="flex flex-col h-full overflow-auto ml-2 p-2">
  {/* --- Submission Result Section --- */}
  {submitResult ? (
    <Section title="Submission Result" className="mb-6">
      <div
        className={`mb-4 px-4 py-3 rounded border font-medium text-sm ${
          submitResult.isCorrect
            ? "bg-green-50 border-green-300 text-green-800"
            : "bg-red-50 border-red-300 text-red-800"
        }`}
      >
        {submitResult.isCorrect ? (
          <>✅ Accepted — Passed {submitResult.passedTestCases} of {submitResult.totalTestCases} testcases.</>
        ) : (
          <>❌ Failed — Passed {submitResult.passedTestCases} of {submitResult.totalTestCases} testcases.</>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2">
        {submitResult.testResults.map((test, idx) => (
          <div
            key={idx}
            className={`rounded border px-4 py-3 shadow-sm transition-all duration-300 ${
              test.passed
                ? "border-green-300 bg-green-50 text-green-800"
                : "border-red-300 bg-red-50 text-red-800"
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-sm">Test Case #{idx + 1}</h4>
              <span className="text-sm font-medium">
                {test.passed ? "✅ Passed" : "❌ Failed"}
              </span>
            </div>

            <div className="text-sm space-y-1">
              <div>
                <span className="font-semibold">Input:</span>{" "}
                <code className="font-mono whitespace-pre-wrap">{test.input}</code>
              </div>
              <div>
                <span className="font-semibold">Expected:</span>{" "}
                <code className="font-mono whitespace-pre-wrap">{test.expectedOutput}</code>
              </div>
              <div>
                <span className="font-semibold">Actual:</span>{" "}
                <code className="font-mono whitespace-pre-wrap">{test.actualOutput}</code>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                ⏱ Time: {test.time}s &nbsp;&nbsp; 📦 Memory: {test.memory}KB
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  ) : (
    <div className="text-muted-foreground text-sm">No submission data available.</div>
  )}

  {/* --- Reference Solution Section --- */}

          </TabsContent>
         <TabsContent value="submission" className="flex flex-col h-full overflow-auto ml-2 p-2">
  {/* --- Submission Result Section --- */}
  <Card className="overflow-auto p-4">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-muted text-muted-foreground">
            <th className="p-2 border">#</th>
            <th className="p-2 border">Passed / Total</th>
            <th className="p-2 border">Correct</th>
            <th className="p-2 border">Verdict</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {submitResultId?.map((submission, index) => (
            <tr key={submission._id} className="border-t">
              <td className="p-2 text-center">{index + 1}</td>
              <td className="p-2 text-center">
                ✅ {submission?.passedTestCases} / {submission?.totalTestCases}
              </td>
              <td className="p-2 text-center">{submission?.isCorrect ? "✅ Yes" : "❌ No"}</td>
              <td className="p-2 text-center">{submission?.verdict}</td>
              <td className="p-2 text-center">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedCode(submission?.sourceCode?.replace(/int\s+main\s*\([^)]*\)\s*\{[\s\S]*?\n\}/, '')?.trim() || "")}
                    >
                      View Solution
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                     <DialogTitle>Solution</DialogTitle>
                    <pre className="text-sm overflow-auto max-h-[500px] whitespace-pre-wrap">
                      {selectedCode}
                    </pre>
                  </DialogContent>
                </Dialog>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>



  {/* --- Reference Solution Section --- */}

          </TabsContent>


         </Tabs>

        {/* RIGHT SIDE */}
        <main className="w-[60%] p-1  flex flex-col h-full overflow-auto  border  border-[#e3e3e3]">
         
            {/* PROBLEM TAB */}
          
              <div className="mb-6 flex items-center mt-4 gap-4">
                <label htmlFor="language-select" className="font-semibold">
                  Language:
                </label>
                <select
                  id="language-select"
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1 shadow-sm max-w-[130px]"
                >
                  {availableLangs.map((availableLang) => (
                    <option key={availableLang} value={availableLang}>
                      {availableLang}
                    </option>
                  ))}
                </select>

                <div className="flex-grow" />

                <Button
                  variant="outline"
                  onClick={handleRun}
                  disabled={runStatus === "loading" || submitStatus === "loading"}
                >
                  {runStatus === "loading" ? (
                    <span className="animate-spin inline-block mr-2 w-4 h-4 border-2 border-t-2 border-gray-600 rounded-full"></span>
                  ) : (
                    "Run"
                  )}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitStatus === "loading" || runStatus === "loading"}
                >
                  {submitStatus === "loading" ? (
                    <span className="animate-spin inline-block mr-2 w-4 h-4 border-2 border-t-2 border-white rounded-full"></span>
                  ) : (
                    "Submit"
                  )}
                </Button>
              </div>

             
                  <CodeEditor
                    key={lang}
                    language={getMonacoLanguage(lang)}
                    value={sourceCode}
                    onChange={onCodeChange}
                  />
               
           

<Tabs value={tabs} onValueChange={setTabs} defaultValue="testcases" className="mt-1">
  <TabsList className="">
    <TabsTrigger value="testcases">Testcases</TabsTrigger>
    <TabsTrigger value="Results">Test Results</TabsTrigger>
  </TabsList>

  {/* --- Tab: Testcases --- */}
  <TabsContent value="testcases">
    {visibleCases?.length === 0 ? (
      <div className="text-muted-foreground">No public test cases.</div>
    ) : (
      <div className="space-x-10 max-h-[300px] overflow-y-auto flex">
        {visibleCases?.map((t, idx) => (
          <Card key={t._id || idx} className="w-50  group relative border">
            <CardContent className="">
              <div className="w-36">
                <span className="font-bold">Input</span>:{" "}
                <code className="font-mono ">{t.input}</code>
              </div>
              <div>
                <span className="font-bold">Output</span>:{" "}
                <code className="font-mono">{t.output}</code>
              </div>
              {t.explanation && (
                <div className="mt-1 text-xs text-muted-foreground">
                  <span className="font-bold">Explanation</span>: {t.explanation}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    )}
  </TabsContent>

  {/* --- Tab: Test Results --- */}
 <TabsContent value="Results">
  {runResult ? (
    <div className="mb-6">
      <p className="font-medium mb-4">
        Passed {runResult.passedTestcases} of {runResult.totalTestcases} visible testcases.
      </p>

      <div className="flex space-x-4 max-h-[400px] overflow-y-auto pr-2">
        {runResult.testResults.map((test, idx) => (
          <div
            key={idx}
            className={`rounded border px-4 py-3 shadow-sm transition-all duration-300 ${
              test.passed
                ? "border-green-300 bg-green-50 text-green-800"
                : "border-red-300 bg-red-50 text-red-800"
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-sm">Test Case #{idx + 1}</h4>
              <span className="text-sm font-medium">
                {test.passed ? "✅ Passed" : "❌ Failed"}
              </span>
            </div>

            <div className="text-sm space-y-1">
              <div>
                <span className="font-semibold">Input:</span>{" "}
                <code className="font-mono whitespace-pre-wrap">{test.input}</code>
              </div>
              <div>
                <span className="font-semibold">Expected:</span>{" "}
                <code className="font-mono whitespace-pre-wrap">{test.expectedOutput}</code>
              </div>
              <div>
                <span className="font-semibold">Actual:</span>{" "}
                <code className="font-mono whitespace-pre-wrap">{test.actualOutput}</code>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                ⏱ Time: {test.time}s &nbsp;&nbsp; 📦 Memory: {test.memory}KB
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ) : (
    <div className="text-muted-foreground">No test results available.</div>
  )}
</TabsContent>

</Tabs>


              {/* Display Submit Results */}
             

              
            

          
            
        
        </main>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="mb-4">
      
      {children}
    </section>
  );
}
