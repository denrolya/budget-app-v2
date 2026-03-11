import { useState, useCallback } from "react";

const CRITERIA = [
  {
    id: "financial",
    label: "Финансовый импакт",
    desc: "Приближает к увеличению дохода?",
    icon: "💰",
  },
  {
    id: "health",
    label: "Здоровье и энергия",
    desc: "Даёт энергию или забирает?",
    icon: "⚡",
  },
  {
    id: "family",
    label: "Семья и отношения",
    desc: "Укрепляет отношения с близкими?",
    icon: "👨‍👩‍👦",
  },
  {
    id: "growth",
    label: "Рост навыков / карьера",
    desc: "Делает тебя сильнее в перспективе?",
    icon: "📈",
  },
  {
    id: "joy",
    label: "Удовольствие / mental health",
    desc: "Подзаряжает или истощает?",
    icon: "🧠",
  },
];

const SCALE_LABELS = {
  "-2": "Вредит",
  "-1": "Скорее мешает",
  0: "Нейтрально",
  1: "Немного помогает",
  2: "Сильно помогает",
};

const SCALE_COLORS = {
  "-2": "#e74c3c",
  "-1": "#e67e22",
  0: "#95a5a6",
  1: "#27ae60",
  2: "#2ecc71",
};

const URGENCY_OPTIONS = [
  { value: "none", label: "Нет срочности", color: "#95a5a6" },
  { value: "low", label: "Этот год", color: "#3498db" },
  { value: "medium", label: "Этот сезон", color: "#e67e22" },
  { value: "high", label: "Этот месяц", color: "#e74c3c" },
];

const COST_OPTIONS = [
  { value: "low", label: "Мало (< 2ч/нед)", color: "#2ecc71" },
  { value: "medium", label: "Средне (2-5ч/нед)", color: "#f39c12" },
  { value: "high", label: "Много (> 5ч/нед)", color: "#e74c3c" },
];

function ScoreBar({ value, max = 10, color }) {
  const pct = Math.max(0, ((value + max) / (max * 2)) * 100);
  return (
    <div
      style={{
        width: "100%",
        height: 8,
        background: "#1a1a2e",
        borderRadius: 4,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          width: 1,
          height: "100%",
          background: "#333",
        }}
      />
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: color,
          borderRadius: 4,
          transition: "width 0.4s ease",
        }}
      />
    </div>
  );
}

function RatingSlider({ value, onChange, criterionId }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {[-2, -1, 0, 1, 2].map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            border: value === v ? `2px solid ${SCALE_COLORS[v]}` : "1px solid #2a2a3e",
            background: value === v ? `${SCALE_COLORS[v]}22` : "#0d0d1a",
            color: value === v ? SCALE_COLORS[v] : "#666",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: value === v ? 700 : 400,
            fontFamily: "'JetBrains Mono', monospace",
            transition: "all 0.15s ease",
          }}
        >
          {v > 0 ? `+${v}` : v}
        </button>
      ))}
      <span
        style={{
          fontSize: 11,
          color: value !== null ? SCALE_COLORS[value] : "#444",
          marginLeft: 4,
          minWidth: 110,
          fontFamily: "'IBM Plex Sans', sans-serif",
        }}
      >
        {value !== null ? SCALE_LABELS[value] : ""}
      </span>
    </div>
  );
}

function ProjectCard({ project, onUpdate, onRemove, index }) {
  const totalScore = CRITERIA.reduce((sum, c) => {
    const val = project.scores[c.id];
    return sum + (val !== null ? val : 0);
  }, 0);

  const allRated = CRITERIA.every((c) => project.scores[c.id] !== null);
  const costMultiplier =
    project.cost === "low" ? 1 : project.cost === "medium" ? 0.7 : 0.4;
  const efficiency = allRated ? (totalScore * costMultiplier).toFixed(1) : "—";

  const getVerdict = () => {
    if (!allRated) return { text: "Оцени все критерии", color: "#444" };
    const eff = parseFloat(efficiency);
    if (eff >= 4)
      return {
        text: "🔥 Фокусируйся на этом",
        color: "#2ecc71",
      };
    if (eff >= 1.5)
      return {
        text: "✅ Стоит продолжать",
        color: "#3498db",
      };
    if (eff >= 0)
      return {
        text: "⚠️ Подумай, стоит ли оно времени",
        color: "#f39c12",
      };
    return {
      text: "🛑 Забирает больше чем даёт",
      color: "#e74c3c",
    };
  };

  const verdict = getVerdict();

  return (
    <div
      style={{
        background: "#0d0d1a",
        border: "1px solid #1a1a2e",
        borderRadius: 16,
        padding: 28,
        position: "relative",
        transition: "border-color 0.2s",
      }}
    >
      <button
        onClick={onRemove}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          background: "none",
          border: "none",
          color: "#333",
          cursor: "pointer",
          fontSize: 18,
          padding: 4,
        }}
        title="Удалить"
      >
        ×
      </button>

      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          value={project.name}
          onChange={(e) => onUpdate({ ...project, name: e.target.value })}
          placeholder="Название проекта..."
          style={{
            background: "none",
            border: "none",
            borderBottom: "1px solid #1a1a2e",
            color: "#e0e0e0",
            fontSize: 20,
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 600,
            width: "80%",
            paddingBottom: 6,
            outline: "none",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 24, marginBottom: 20, flexWrap: "wrap" }}>
        <div>
          <div
            style={{
              fontSize: 11,
              color: "#555",
              marginBottom: 6,
              fontFamily: "'IBM Plex Sans', sans-serif",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Срочность
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {URGENCY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onUpdate({ ...project, urgency: opt.value })}
                style={{
                  padding: "5px 10px",
                  borderRadius: 6,
                  border:
                    project.urgency === opt.value
                      ? `1px solid ${opt.color}`
                      : "1px solid #1a1a2e",
                  background:
                    project.urgency === opt.value ? `${opt.color}18` : "#0d0d1a",
                  color: project.urgency === opt.value ? opt.color : "#555",
                  cursor: "pointer",
                  fontSize: 12,
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  transition: "all 0.15s ease",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: 11,
              color: "#555",
              marginBottom: 6,
              fontFamily: "'IBM Plex Sans', sans-serif",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Затраты времени
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {COST_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onUpdate({ ...project, cost: opt.value })}
                style={{
                  padding: "5px 10px",
                  borderRadius: 6,
                  border:
                    project.cost === opt.value
                      ? `1px solid ${opt.color}`
                      : "1px solid #1a1a2e",
                  background:
                    project.cost === opt.value ? `${opt.color}18` : "#0d0d1a",
                  color: project.cost === opt.value ? opt.color : "#555",
                  cursor: "pointer",
                  fontSize: 12,
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  transition: "all 0.15s ease",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        {CRITERIA.map((c) => (
          <div key={c.id}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 4,
              }}
            >
              <span style={{ fontSize: 14 }}>{c.icon}</span>
              <span
                style={{
                  fontSize: 13,
                  color: "#888",
                  fontFamily: "'IBM Plex Sans', sans-serif",
                }}
              >
                {c.label}
              </span>
              <span style={{ fontSize: 11, color: "#444" }}>— {c.desc}</span>
            </div>
            <RatingSlider
              value={project.scores[c.id]}
              onChange={(v) =>
                onUpdate({
                  ...project,
                  scores: { ...project.scores, [c.id]: v },
                })
              }
              criterionId={c.id}
            />
          </div>
        ))}
      </div>

      <div
        style={{
          borderTop: "1px solid #1a1a2e",
          paddingTop: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <span
            style={{
              fontSize: 11,
              color: "#555",
              textTransform: "uppercase",
              letterSpacing: 1,
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}
          >
            Общий скор:{" "}
          </span>
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: totalScore > 0 ? "#2ecc71" : totalScore < 0 ? "#e74c3c" : "#888",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {allRated ? totalScore : "—"}
          </span>
          <span
            style={{
              fontSize: 11,
              color: "#555",
              marginLeft: 16,
              textTransform: "uppercase",
              letterSpacing: 1,
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}
          >
            Эффективность:{" "}
          </span>
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              color:
                efficiency !== "—"
                  ? parseFloat(efficiency) >= 1.5
                    ? "#2ecc71"
                    : parseFloat(efficiency) >= 0
                    ? "#f39c12"
                    : "#e74c3c"
                  : "#888",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {efficiency}
          </span>
        </div>
        <div
          style={{
            fontSize: 13,
            color: verdict.color,
            fontWeight: 600,
            fontFamily: "'IBM Plex Sans', sans-serif",
          }}
        >
          {verdict.text}
        </div>
      </div>
    </div>
  );
}

function SummaryTable({ projects }) {
  const evaluated = projects.filter((p) =>
    CRITERIA.every((c) => p.scores[c.id] !== null)
  );

  if (evaluated.length === 0) return null;

  const sorted = [...evaluated].sort((a, b) => {
    const scoreA = CRITERIA.reduce((s, c) => s + a.scores[c.id], 0);
    const scoreB = CRITERIA.reduce((s, c) => s + b.scores[c.id], 0);
    const costA = a.cost === "low" ? 1 : a.cost === "medium" ? 0.7 : 0.4;
    const costB = b.cost === "low" ? 1 : b.cost === "medium" ? 0.7 : 0.4;
    return scoreB * costB - scoreA * costA;
  });

  return (
    <div
      style={{
        background: "#0d0d1a",
        border: "1px solid #1a1a2e",
        borderRadius: 16,
        padding: 28,
        marginTop: 24,
      }}
    >
      <h3
        style={{
          color: "#e0e0e0",
          margin: "0 0 20px 0",
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 18,
          fontWeight: 600,
        }}
      >
        Рейтинг проектов
      </h3>
      {sorted.map((p, i) => {
        const total = CRITERIA.reduce((s, c) => s + p.scores[c.id], 0);
        const costM = p.cost === "low" ? 1 : p.cost === "medium" ? 0.7 : 0.4;
        const eff = (total * costM).toFixed(1);
        const maxScore = 10;
        const barColor =
          parseFloat(eff) >= 4
            ? "#2ecc71"
            : parseFloat(eff) >= 1.5
            ? "#3498db"
            : parseFloat(eff) >= 0
            ? "#f39c12"
            : "#e74c3c";

        return (
          <div
            key={p.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <span
              style={{
                fontSize: 14,
                color: "#333",
                fontFamily: "'JetBrains Mono', monospace",
                minWidth: 24,
              }}
            >
              {i + 1}.
            </span>
            <span
              style={{
                fontSize: 14,
                color: "#ccc",
                minWidth: 160,
                fontFamily: "'IBM Plex Sans', sans-serif",
              }}
            >
              {p.name || "Без названия"}
            </span>
            <div style={{ flex: 1 }}>
              <ScoreBar value={total} max={maxScore} color={barColor} />
            </div>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: barColor,
                minWidth: 40,
                textAlign: "right",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {eff}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function generateMarkdown(projects) {
  const date = new Date().toLocaleDateString("ru-RU");
  let md = `# Оценка проектов — ${date}\n\n`;

  const evaluated = projects.filter((p) =>
    CRITERIA.every((c) => p.scores[c.id] !== null)
  );

  const sorted = [...evaluated].sort((a, b) => {
    const scoreA = CRITERIA.reduce((s, c) => s + a.scores[c.id], 0);
    const scoreB = CRITERIA.reduce((s, c) => s + b.scores[c.id], 0);
    const costA = a.cost === "low" ? 1 : a.cost === "medium" ? 0.7 : 0.4;
    const costB = b.cost === "low" ? 1 : b.cost === "medium" ? 0.7 : 0.4;
    return scoreB * costB - scoreA * costA;
  });

  md += `## Рейтинг\n\n`;
  md += `| # | Проект | Скор | Время | Эффективность | Срочность |\n`;
  md += `|---|--------|------|-------|---------------|----------|\n`;

  sorted.forEach((p, i) => {
    const total = CRITERIA.reduce((s, c) => s + p.scores[c.id], 0);
    const costLabel =
      p.cost === "low" ? "< 2ч" : p.cost === "medium" ? "2-5ч" : "> 5ч";
    const costM = p.cost === "low" ? 1 : p.cost === "medium" ? 0.7 : 0.4;
    const eff = (total * costM).toFixed(1);
    const urgLabel =
      p.urgency === "high"
        ? "Месяц"
        : p.urgency === "medium"
        ? "Сезон"
        : p.urgency === "low"
        ? "Год"
        : "—";
    md += `| ${i + 1} | ${p.name || "?"} | ${total} | ${costLabel}/нед | ${eff} | ${urgLabel} |\n`;
  });

  md += `\n## Детали\n\n`;
  sorted.forEach((p) => {
    md += `### ${p.name || "Без названия"}\n\n`;
    CRITERIA.forEach((c) => {
      const v = p.scores[c.id];
      const label =
        v === 2
          ? "сильно помогает"
          : v === 1
          ? "немного помогает"
          : v === 0
          ? "нейтрально"
          : v === -1
          ? "скорее мешает"
          : "вредит";
      md += `- ${c.icon} ${c.label}: **${v > 0 ? "+" : ""}${v}** (${label})\n`;
    });
    md += `\n`;
  });

  md += `---\n*Эффективность = общий скор × коэффициент затрат времени (мало: ×1, средне: ×0.7, много: ×0.4)*\n`;

  return md;
}

const createEmptyProject = () => ({
  id: Date.now() + Math.random(),
  name: "",
  urgency: "none",
  cost: "medium",
  scores: {
    financial: null,
    health: null,
    family: null,
    growth: null,
    joy: null,
  },
});

export default function ProjectEvaluator() {
  const [projects, setProjects] = useState([
    { ...createEmptyProject(), name: "Система финансов" },
    { ...createEmptyProject(), name: "" },
  ]);
  const [copied, setCopied] = useState(false);

  const addProject = () => {
    setProjects([...projects, createEmptyProject()]);
  };

  const updateProject = (index, updated) => {
    const next = [...projects];
    next[index] = updated;
    setProjects(next);
  };

  const removeProject = (index) => {
    if (projects.length <= 1) return;
    setProjects(projects.filter((_, i) => i !== index));
  };

  const exportMd = () => {
    const md = generateMarkdown(projects);
    navigator.clipboard.writeText(md).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#06060f",
        color: "#e0e0e0",
        fontFamily: "'IBM Plex Sans', sans-serif",
        padding: "40px 20px",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;700&display=swap"
        rel="stylesheet"
      />
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ marginBottom: 40 }}>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif",
              color: "#fff",
              margin: 0,
              letterSpacing: -0.5,
            }}
          >
            Оценка проектов
          </h1>
          <p
            style={{
              color: "#555",
              fontSize: 14,
              marginTop: 8,
              lineHeight: 1.5,
            }}
          >
            Оцени каждый проект по 5 критериям от −2 до +2.
            <br />
            Эффективность учитывает скор и затраты времени.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {projects.map((p, i) => (
            <ProjectCard
              key={p.id}
              project={p}
              index={i}
              onUpdate={(updated) => updateProject(i, updated)}
              onRemove={() => removeProject(i)}
            />
          ))}
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 20,
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={addProject}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              border: "1px dashed #1a1a2e",
              background: "none",
              color: "#555",
              cursor: "pointer",
              fontSize: 14,
              fontFamily: "'IBM Plex Sans', sans-serif",
              transition: "all 0.15s ease",
            }}
            onMouseOver={(e) => {
              e.target.style.borderColor = "#3498db";
              e.target.style.color = "#3498db";
            }}
            onMouseOut={(e) => {
              e.target.style.borderColor = "#1a1a2e";
              e.target.style.color = "#555";
            }}
          >
            + Добавить проект
          </button>
          <button
            onClick={exportMd}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              border: "1px solid #1a1a2e",
              background: copied ? "#2ecc7122" : "none",
              color: copied ? "#2ecc71" : "#555",
              cursor: "pointer",
              fontSize: 14,
              fontFamily: "'IBM Plex Sans', sans-serif",
              transition: "all 0.15s ease",
            }}
            onMouseOver={(e) => {
              if (!copied) {
                e.target.style.borderColor = "#888";
                e.target.style.color = "#888";
              }
            }}
            onMouseOut={(e) => {
              if (!copied) {
                e.target.style.borderColor = "#1a1a2e";
                e.target.style.color = "#555";
              }
            }}
          >
            {copied ? "✓ Скопировано в буфер" : "📋 Экспорт в Markdown"}
          </button>
        </div>

        <SummaryTable projects={projects} />
      </div>
    </div>
  );
}
