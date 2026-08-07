export const difficultyMeta = {
  Easy: { label: "Foundation", description: "Guided decisions that build core confidence and safe habits.", className: "easy" },
  Medium: { label: "Applied", description: "Multi-step situations with competing priorities and operational pressure.", className: "medium" },
  Hard: { label: "Expert", description: "Complex incidents with uncertainty, dependencies and cascading risk.", className: "hard" },
};

export function imageUrl(scenario) {
  return scenario.imageUrl || `/scenarios/${scenario.imageKey || "phishing-email"}.svg`;
}

export function resultTone(score) {
  if (score >= 90) return "mastery";
  if (score >= 75) return "strong";
  if (score >= 55) return "developing";
  return "needs-review";
}

export function shuffleChoices(choices) {
  const shuffled = [...choices];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const random = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[random]] = [shuffled[random], shuffled[index]];
  }
  return shuffled;
}
