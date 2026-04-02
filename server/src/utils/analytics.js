function toAverageMap(activityLog = []) {
  const aggregate = {};

  activityLog.forEach((item) => {
    if (!item.subject) {
      return;
    }

    if (!aggregate[item.subject]) {
      aggregate[item.subject] = { score: 0, total: 0, attempts: 0 };
    }

    aggregate[item.subject].score += Number(item.score || 0);
    aggregate[item.subject].total += Number(item.total || 5);
    aggregate[item.subject].attempts += 1;
  });

  return Object.entries(aggregate).reduce((acc, [subject, item]) => {
    const normalized = item.total === 0 ? 0 : Number(((item.score / item.total) * 5).toFixed(2));
    acc[subject] = normalized;
    return acc;
  }, {});
}

function weakSubjectsFromScores(subjectScores = {}, threshold = 3) {
  return Object.entries(subjectScores)
    .filter(([, score]) => Number(score) < threshold)
    .sort((a, b) => a[1] - b[1])
    .map(([subject]) => subject);
}

module.exports = {
  toAverageMap,
  weakSubjectsFromScores
};
