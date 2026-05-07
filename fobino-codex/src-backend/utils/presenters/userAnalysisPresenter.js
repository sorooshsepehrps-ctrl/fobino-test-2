function presentCriterion(item) {
  return {
    key: item.key,
    title: item.title,
    score: item.score,
    maxScore: item.maxScore,
    passed: item.passed,
    percentage: item.percentage ?? Math.round(((item.score || 0) / (item.maxScore || 1)) * 100),
    description: item.description,
    actionHint: item.actionHint || null,
  };
}

function presentUserAnalysis(analysis) {
  return {
    user: analysis.user || null,
    totalScore: analysis.totalScore || 0,
    maxScore: analysis.maxScore || 65,
    grade: analysis.grade || 'D',
    gradeLabel: analysis.gradeLabel || `Grade ${analysis.grade || 'D'}`,
    gradeMeta: analysis.gradeMeta || null,
    breakdown: Array.isArray(analysis.breakdown) ? analysis.breakdown.map(presentCriterion) : [],
    charts: analysis.charts || {},
    facts: analysis.facts || {},
    suggestions: analysis.suggestions || [],
  };
}

module.exports = { presentUserAnalysis, presentCriterion };
