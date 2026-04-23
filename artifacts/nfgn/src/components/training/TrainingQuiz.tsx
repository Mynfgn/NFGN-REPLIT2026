import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, XCircle, RotateCcw, Trophy, ClipboardList,
  ChevronLeft, ChevronRight, AlertCircle,
} from "lucide-react";

const GOLD = "#C9A84C";
const GREEN = "#2D6A4F";

export interface QuizQuestion {
  question: string;
  options: [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
  explanation: string;
}

interface Props {
  title: string;
  questions: QuizQuestion[];
}

function ScoreRing({ score, total }: { score: number; total: number }) {
  const pct = Math.round((score / total) * 100);
  const color = pct >= 80 ? "#22c55e" : pct >= 60 ? GOLD : "#ef4444";
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="h-24 w-24 rounded-full flex items-center justify-center text-2xl font-bold border-4"
        style={{ borderColor: color, color }}
      >
        {pct}%
      </div>
      <p className="text-xs text-muted-foreground">{score} / {total} correct</p>
    </div>
  );
}

export function TrainingQuiz({ title, questions }: Props) {
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const reset = () => {
    setStarted(false);
    setCurrent(0);
    setAnswers(Array(questions.length).fill(null));
    setSubmitted(false);
    setShowReview(false);
  };

  const score = answers.filter((a, i) => a === questions[i].correct).length;
  const pct = Math.round((score / questions.length) * 100);
  const passed = pct >= 70;
  const allAnswered = answers.every(a => a !== null);

  const select = (optionIdx: number) => {
    if (submitted) return;
    setAnswers(prev => {
      const next = [...prev];
      next[current] = optionIdx;
      return next;
    });
  };

  const q = questions[current];
  const selected = answers[current];
  const LABELS = ["A", "B", "C", "D"];

  if (!started) {
    return (
      <Card className="border-2 border-dashed border-primary/30 bg-primary/3">
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="h-14 w-14 rounded-2xl flex items-center justify-center" style={{ background: `${GOLD}20` }}>
              <ClipboardList className="h-7 w-7" style={{ color: GOLD }} />
            </div>
            <div>
              <p className="text-lg font-serif font-bold">{title}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {questions.length} questions · Multiple choice · Pass score: 70%
              </p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> Instant feedback</span>
              <span className="flex items-center gap-1"><RotateCcw className="h-3.5 w-3.5 text-blue-500" /> Retake anytime</span>
              <span className="flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5 text-amber-500" /> Review all answers</span>
            </div>
            <Button onClick={() => setStarted(true)} className="px-8" style={{ background: GOLD, color: "#0a0a0a" }}>
              Start Proficiency Quiz
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (submitted && !showReview) {
    return (
      <Card className={`border-2 ${passed ? "border-green-300 bg-green-50/40" : "border-red-200 bg-red-50/40"}`}>
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col items-center text-center gap-4">
            <ScoreRing score={score} total={questions.length} />

            {passed ? (
              <>
                <div className="flex items-center gap-2 text-green-700">
                  <Trophy className="h-5 w-5" />
                  <p className="text-lg font-bold">Quiz Passed!</p>
                </div>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Excellent work! You scored {pct}% — demonstrating solid proficiency in this training module. Keep up the great effort.
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  <p className="text-lg font-bold">Not Quite There Yet</p>
                </div>
                <p className="text-sm text-muted-foreground max-w-sm">
                  You scored {pct}% — the passing score is 70%. Review the training content and the answer explanations below, then try again.
                </p>
              </>
            )}

            <div className="flex gap-3 flex-wrap justify-center">
              <Button variant="outline" size="sm" onClick={() => setShowReview(true)} className="gap-1.5">
                <ClipboardList className="h-4 w-4" /> Review Answers
              </Button>
              <Button size="sm" onClick={reset} className="gap-1.5" variant="outline">
                <RotateCcw className="h-4 w-4" /> Retake Quiz
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (submitted && showReview) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" /> Answer Review — {title}
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">
                {score}/{questions.length} correct
              </Badge>
              <Button size="sm" variant="outline" onClick={reset} className="gap-1 h-7 text-xs">
                <RotateCcw className="h-3.5 w-3.5" /> Retake
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {questions.map((q, qi) => {
            const userAns = answers[qi];
            const isCorrect = userAns === q.correct;
            return (
              <div key={qi} className={`rounded-xl border p-4 ${isCorrect ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/40"}`}>
                <div className="flex gap-2 items-start mb-3">
                  {isCorrect
                    ? <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    : <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                  }
                  <p className="text-sm font-semibold text-foreground">
                    <span className="text-muted-foreground font-normal mr-1">Q{qi + 1}.</span>
                    {q.question}
                  </p>
                </div>
                <div className="space-y-1.5 ml-6">
                  {q.options.map((opt, oi) => {
                    const isUser = userAns === oi;
                    const isRight = q.correct === oi;
                    let cls = "text-xs rounded px-2 py-1.5 flex gap-2 items-start ";
                    if (isRight) cls += "bg-green-100 text-green-800 font-medium";
                    else if (isUser && !isRight) cls += "bg-red-100 text-red-700 line-through";
                    else cls += "text-muted-foreground";
                    return (
                      <div key={oi} className={cls}>
                        <span className="font-bold w-4 flex-shrink-0">{LABELS[oi]}.</span>
                        <span>{opt}</span>
                        {isRight && <CheckCircle2 className="h-3.5 w-3.5 ml-auto flex-shrink-0 mt-0.5 text-green-600" />}
                        {isUser && !isRight && <XCircle className="h-3.5 w-3.5 ml-auto flex-shrink-0 mt-0.5 text-red-500" />}
                      </div>
                    );
                  })}
                </div>
                <div className="ml-6 mt-3 bg-white border rounded-lg px-3 py-2">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <span className="font-semibold text-foreground">Explanation: </span>
                    {q.explanation}
                  </p>
                </div>
              </div>
            );
          })}
          <Button variant="outline" size="sm" onClick={reset} className="w-full gap-1.5">
            <RotateCcw className="h-4 w-4" /> Retake Quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Active quiz — one question at a time
  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {current + 1} / {questions.length}
            </span>
            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-2 rounded-full transition-all"
                style={{ width: `${((current + 1) / questions.length) * 100}%`, background: GOLD }}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Question */}
        <div className="rounded-xl bg-muted/30 border p-4">
          <p className="text-xs text-muted-foreground mb-1">Question {current + 1} of {questions.length}</p>
          <p className="text-sm font-semibold text-foreground leading-relaxed">{q.question}</p>
        </div>

        {/* Options */}
        <div className="space-y-2">
          {q.options.map((opt, oi) => {
            const isSelected = selected === oi;
            return (
              <button
                key={oi}
                onClick={() => select(oi)}
                className={`w-full text-left rounded-xl border px-4 py-3 text-sm transition-all flex gap-3 items-start
                  ${isSelected
                    ? "border-primary bg-primary/10 font-medium"
                    : "border-muted hover:border-primary/50 hover:bg-muted/30"
                  }`}
              >
                <span
                  className={`h-6 w-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border
                    ${isSelected ? "text-white border-transparent" : "border-muted-foreground/40 text-muted-foreground"}`}
                  style={isSelected ? { background: GOLD, borderColor: GOLD } : {}}
                >
                  {LABELS[oi]}
                </span>
                <span className={isSelected ? "text-foreground" : "text-muted-foreground"}>{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Nav */}
        <div className="flex items-center justify-between pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrent(c => Math.max(0, c - 1))}
            disabled={current === 0}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>

          <div className="flex gap-1">
            {questions.map((_, qi) => (
              <button
                key={qi}
                onClick={() => setCurrent(qi)}
                className={`h-2 w-2 rounded-full transition-all ${qi === current ? "scale-125" : ""}`}
                style={{
                  background: answers[qi] !== null
                    ? GOLD
                    : qi === current
                    ? "#0a0a0a"
                    : "#e5e7eb",
                }}
              />
            ))}
          </div>

          {current < questions.length - 1 ? (
            <Button
              size="sm"
              onClick={() => setCurrent(c => c + 1)}
              className="gap-1"
              style={{ background: GOLD, color: "#0a0a0a" }}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setSubmitted(true)}
              disabled={!allAnswered}
              className="gap-1"
              style={allAnswered ? { background: GREEN, color: "white" } : {}}
            >
              <CheckCircle2 className="h-4 w-4" />
              {allAnswered ? "Submit Quiz" : `${answers.filter(a => a !== null).length}/${questions.length} answered`}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
