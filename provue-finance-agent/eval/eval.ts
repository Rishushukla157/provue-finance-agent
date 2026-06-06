type EvalCase = {
  name: string;
  question: string;
  expectedAny: string[];
};

const tests: EvalCase[] = [
  {
    name: "Portfolio Value",
    question: "What is my portfolio worth today?",
    expectedAny: ["119983", "11998380"],
  },
  {
    name: "Best Fund",
    question: "Which fund performed best between 2024-01-01 and 2025-01-01?",
    expectedAny: ["saffronbluechip", "3117"],
  },
{
  name: "Swiggy Spend",
  question: "How much did I spend on Swiggy from 2024-01-01 to 2025-03-31?",
  expectedAny: ["47239", "4723923", "swiggy"],
},
  {
    name: "Top Merchants",
    question: "Who are my top 5 merchants from 2024-01-01 to 2025-03-31?",
    expectedAny: ["airindia", "indigo", "neft"],
  },
  {
    name: "Monthly Food Spend",
    question: "Show monthly food spending from 2024-01-01 to 2025-03-31.",
    expectedAny: ["food", "2025", "13121"],
  },
];

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[₹,\s*_%.\-–—|()]/g, "")
    .replace(/\u202f/g, "")
    .replace(/\u00a0/g, "");
}

async function run() {
  let passed = 0;

  console.log("\n=== Provue Finance Agent Evaluation ===\n");

  for (const test of tests) {
    try {
      const response = await fetch("http://127.0.0.1:3000/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: test.question,
        }),
      });

      const result = await response.json();
      const answer = String(result.answer || "");
      const normalizedAnswer = normalize(answer);

      const ok = test.expectedAny.some((expected) =>
        normalizedAnswer.includes(normalize(expected))
      );

      console.log(`${ok ? "PASS" : "FAIL"} | ${test.name}`);
      console.log(`Q: ${test.question}`);
      console.log(`A: ${answer.slice(0, 300)}${answer.length > 300 ? "..." : ""}`);
      console.log("");

      if (ok) passed++;
    } catch (error) {
      console.log(`FAIL | ${test.name}`);
      console.error(error);
    }
  }

  console.log(`Result: ${passed}/${tests.length} tests passed`);

  if (passed !== tests.length) {
    process.exit(1);
  }
}

run();