const syntaxHighlighter = window.hljs;

const translationLanguages = {
  javascript: { name: "JavaScript", tag: "JS", extension: "js" },
  typescript: { name: "TypeScript", tag: "TS", extension: "ts" },
  python: { name: "Python", tag: "PY", extension: "py" },
  java: { name: "Java", tag: "JAVA", extension: "java" },
  cpp: { name: "C++", tag: "C++", extension: "cpp" },
  csharp: { name: "C#", tag: "C#", extension: "cs" },
  go: { name: "Go", tag: "GO", extension: "go" },
  php: { name: "PHP", tag: "PHP", extension: "php" },
  sql: { name: "SQL", tag: "SQL", extension: "sql" },
};

const codeInput = document.querySelector("#code-input");
const codeCount = document.querySelector("#code-count");
const exampleSelect = document.querySelector("#example-select");
const difficultySelect = document.querySelector("#difficulty-select");
const explainButton = document.querySelector("#explain-button");
const clearButton = document.querySelector("#clear-button");
const copyCodeButton = document.querySelector("#copy-code-button");
const copyExplanationButton = document.querySelector("#copy-explanation-button");
const requestMessage = document.querySelector("#request-message");
const resultContent = document.querySelector("#result-content");
const resultPanel = document.querySelector(".result-panel");
const emptyState = document.querySelector("#empty-state");
const loadingState = document.querySelector("#loading-state");
const generationPromptInput = document.querySelector("#generation-prompt");
const promptCount = document.querySelector("#prompt-count");
const generateButton = document.querySelector("#generate-button");
const clearGenerationButton = document.querySelector("#clear-generation-button");
const generatorMessage = document.querySelector("#generator-message");
const generatorResultContent = document.querySelector("#generator-result-content");
const generatorResultPanel = document.querySelector(".generator-result-panel");
const generatorEmptyState = document.querySelector("#generator-empty-state");
const generatorLoadingState = document.querySelector("#generator-loading-state");
const copyGeneratedCodeButton = document.querySelector("#copy-generated-code-button");
const translationInput = document.querySelector("#translation-input");
const sourceLanguageSelect = document.querySelector("#source-language");
const targetLanguageSelect = document.querySelector("#target-language");
const sourceFileName = document.querySelector("#source-file-name");
const sourceLanguageTag = document.querySelector("#source-language-tag");
const translatorCodeCount = document.querySelector("#translator-code-count");
const translateButton = document.querySelector("#translate-button");
const clearTranslationButton = document.querySelector("#clear-translation-button");
const translatorMessage = document.querySelector("#translator-message");
const translatorResultContent = document.querySelector("#translator-result-content");
const translatorResultPanel = document.querySelector(".translator-result-panel");
const translatorEmptyState = document.querySelector("#translator-empty-state");
const translatorLoadingState = document.querySelector("#translator-loading-state");
const copyTranslatedCodeButton = document.querySelector("#copy-translated-code-button");

const examples = {
  discount: `function calculateDiscount(price, percentage) {
  if (price < 0 || percentage < 0 || percentage > 100) return null;
  const discount = price * (percentage / 100);
  return price - discount;
}

const finalPrice = calculateDiscount(80, 25);
console.log("Your price is $" + finalPrice);`,
  group: `function groupBy(items, key) {
  return items.reduce((groups, item) => {
    const group = item[key];
    groups[group] ??= [];
    groups[group].push(item);
    return groups;
  }, {});
}

const people = [
  { name: "Mina", role: "designer" },
  { name: "Leo", role: "developer" },
  { name: "Ari", role: "designer" }
];

console.log(groupBy(people, "role"));`,
  retry: `async function fetchWithRetry(url, attempts = 3) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("HTTP " + response.status);
      return await response.json();
    } catch (error) {
      if (attempt === attempts) throw error;
    }
  }
}

fetchWithRetry("/api/items")
  .then((items) => console.log(items))
  .catch((error) => console.error(error.message));`,
};

let latestExplanation = "";
let latestGeneratedCode = "";
let latestTranslatedCode = "";

function updateCodeCount() {
  const code = codeInput.value;
  const lines = code ? code.split("\n").length : 0;
  codeCount.textContent = `${lines} ${lines === 1 ? "line" : "lines"} · ${code.length} ${code.length === 1 ? "character" : "characters"}`;
}

function setMessage(message, kind = "error") {
  requestMessage.textContent = message;
  requestMessage.dataset.kind = kind;
}

function setLoading(isLoading) {
  explainButton.disabled = isLoading;
  clearButton.disabled = isLoading;
  codeInput.disabled = isLoading;
  exampleSelect.disabled = isLoading;
  difficultySelect.disabled = isLoading;
  explainButton.querySelector(".button-label").textContent = isLoading ? "Explaining..." : "Explain code";
  resultPanel.setAttribute("aria-busy", String(isLoading));
  loadingState.hidden = !isLoading;
  if (isLoading) {
    emptyState.hidden = true;
    resultContent.querySelector(".explanation, .error-panel")?.remove();
    copyExplanationButton.disabled = true;
  }
}

function appendInlineText(parent, text) {
  const tokenPattern = /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_)/g;
  let cursor = 0;

  for (const match of text.matchAll(tokenPattern)) {
    parent.append(document.createTextNode(text.slice(cursor, match.index)));
    const token = match[0];
    const isCode = token.startsWith("`");
    const isStrong = token.startsWith("**") || token.startsWith("__");
    const element = document.createElement(isCode ? "code" : isStrong ? "strong" : "em");
    const delimiterLength = isStrong ? 2 : 1;
    element.textContent = token.slice(delimiterLength, -delimiterLength);
    parent.append(element);
    cursor = match.index + token.length;
  }

  parent.append(document.createTextNode(text.slice(cursor)));
}

function renderMarkdown(markdown) {
  const container = document.createElement("div");
  container.className = "explanation";
  const lines = markdown.replaceAll("\r\n", "\n").split("\n");
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) { index++; continue; }

    if (line.startsWith("```")) {
      const codeLines = [];
      index++;
      while (index < lines.length && !lines[index].trim().startsWith("```")) codeLines.push(lines[index++]);
      if (index < lines.length) index++;
      const pre = document.createElement("pre");
      const code = document.createElement("code");
      code.textContent = codeLines.join("\n");
      pre.append(code);
      container.append(pre);
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const element = document.createElement(`h${heading[1].length}`);
      appendInlineText(element, heading[2]);
      container.append(element);
      index++;
      continue;
    }

    if (/^[-*_]{3,}$/.test(line)) {
      container.append(document.createElement("hr"));
      index++;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote = document.createElement("blockquote");
      while (index < lines.length && /^>\s?/.test(lines[index].trim())) {
        const paragraph = document.createElement("p");
        appendInlineText(paragraph, lines[index++].trim().replace(/^>\s?/, ""));
        quote.append(paragraph);
      }
      container.append(quote);
      continue;
    }

    const listMatch = line.match(/^\s*([-*+] |\d+[.)] )/);
    if (listMatch) {
      const ordered = /^\d/.test(listMatch[1]);
      const list = document.createElement(ordered ? "ol" : "ul");
      const itemPattern = ordered ? /^\s*\d+[.)] (.+)$/ : /^\s*[-*+] (.+)$/;
      while (index < lines.length) {
        const itemMatch = lines[index].match(itemPattern);
        if (!itemMatch) break;
        const item = document.createElement("li");
        appendInlineText(item, itemMatch[1]);
        list.append(item);
        index++;
      }
      container.append(list);
      continue;
    }

    const paragraphLines = [];
    while (index < lines.length && lines[index].trim() && !/^(#{1,3}\s|```|>\s?|[-*+] |\d+[.)] )/.test(lines[index].trim())) {
      paragraphLines.push(lines[index++].trim());
    }
    if (paragraphLines.length === 0) { index++; continue; }
    const paragraph = document.createElement("p");
    appendInlineText(paragraph, paragraphLines.join(" "));
    container.append(paragraph);
  }

  return container;
}

async function copyText(text, successMessage, messageElement = requestMessage) {
  if (!text) {
    setElementMessage(messageElement, "There is nothing to copy yet.");
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const temporaryInput = document.createElement("textarea");
    temporaryInput.value = text;
    temporaryInput.setAttribute("readonly", "");
    temporaryInput.style.position = "fixed";
    temporaryInput.style.opacity = "0";
    document.body.append(temporaryInput);
    temporaryInput.select();
    const copied = document.execCommand("copy");
    temporaryInput.remove();
    if (!copied) {
      setElementMessage(messageElement, "Clipboard access was blocked by your browser.");
      return;
    }
  }

  setElementMessage(messageElement, successMessage, "success");
}

function setElementMessage(element, message, kind = "error") {
  element.textContent = message;
  element.dataset.kind = kind;
}

// Consume Ollama's NDJSON stream and forward each generated fragment to its feature UI.
async function streamOllama(endpoint, requestBody, onToken) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    if (response.status === 405) {
      throw new Error(endpoint === "/api/explain"
        ? "This page is being served without the AI backend. Start this app with npm start, then open http://localhost:3000."
        : "This page is being served without the AI backend. Start this app with npm start, then open the app using its local server URL.");
    }
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || `The request failed (${response.status}). Please try again.`);
  }

  // Accept the previous JSON API response while an already-running server is awaiting restart.
  if (response.headers.get("content-type")?.includes("application/json")) {
    const result = await response.json();
    const content = endpoint === "/api/explain" ? result.explanation : result.code;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error(result.error || "The server returned an empty response. Restart the app server and try again.");
    }
    onToken(content);
    return { content, stats: null };
  }

  if (!response.body) {
    throw new Error("The browser could not read the response stream. Please try again.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const chunks = [];
  let pending = "";
  let stats = null;

  function processLine(line) {
    if (!line.trim()) return;
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      throw new Error("The server returned an invalid streamed response.");
    }
    if (event.type === "error") throw new Error(event.error || "The Ollama request failed.");
    if (event.type === "token" && typeof event.content === "string") {
      chunks.push(event.content);
      onToken(event.content);
    }
    if (event.type === "done") stats = event.stats;
  }

  try {
    while (true) {
      const { value, done } = await reader.read();
      pending += decoder.decode(value || new Uint8Array(), { stream: !done });
      const lines = pending.split("\n");
      pending = lines.pop() || "";
      for (const line of lines) processLine(line);
      if (done) break;
    }
    if (pending.trim()) processLine(pending);
  } finally {
    reader.releaseLock();
  }

  const content = chunks.join("");
  if (!content.trim()) throw new Error("The response stream completed without text. Please retry the request.");
  return { content, stats };
}

function performanceMessage(stats, completedLabel) {
  if (!stats) return `${completedLabel}.`;
  const startTime = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(stats.requestStartTime));
  const duration = (stats.responseTimeMs / 1000).toFixed(1);
  const tokens = Number.isInteger(stats.tokenCount) ? `${stats.tokenCount} tokens` : "token count unavailable";
  return `${completedLabel} · ${duration}s · ${tokens} · started ${startTime}`;
}

async function explainCode() {
  const code = codeInput.value.trim();
  setMessage("");

  if (!code) {
    setMessage("Add some JavaScript first, then I can explain it.");
    codeInput.focus();
    return;
  }

  setLoading(true);
  const stream = document.createElement("div");
  stream.className = "explanation explanation-stream";
  let streamedText = "";
  try {
    const result = await streamOllama("/api/explain", { code, difficulty: difficultySelect.value }, (token) => {
      streamedText += token;
      if (!stream.isConnected) resultContent.append(stream);
      loadingState.hidden = true;
      stream.textContent = streamedText;
    });

    latestExplanation = result.content;
    stream.replaceWith(renderMarkdown(latestExplanation));
    copyExplanationButton.disabled = false;
    setMessage(performanceMessage(result.stats, "Explanation ready"), "success");
  } catch (error) {
    stream.remove();
    resultContent.querySelector(".explanation, .error-panel")?.remove();
    const errorPanel = document.createElement("div");
    errorPanel.className = "error-panel";
    errorPanel.setAttribute("role", "alert");
    errorPanel.textContent = error instanceof TypeError
      ? "Could not reach the app server. Make sure it is running and try again."
      : error.message;
    resultContent.append(errorPanel);
    copyExplanationButton.disabled = true;
    setMessage("We couldn't finish that request.");
  } finally {
    setLoading(false);
  }
}

// Keep generation state separate so it cannot change the existing explanation workflow.
function setGenerationLoading(isLoading) {
  generateButton.disabled = isLoading;
  clearGenerationButton.disabled = isLoading;
  generationPromptInput.disabled = isLoading;
  generateButton.querySelector(".button-label").textContent = isLoading ? "Generating..." : "Generate code";
  generatorResultPanel.setAttribute("aria-busy", String(isLoading));
  generatorLoadingState.hidden = !isLoading;
  if (isLoading) {
    generatorEmptyState.hidden = true;
    generatorResultContent.querySelector(".generated-code, .error-panel")?.remove();
    copyGeneratedCodeButton.disabled = true;
  }
}

function updatePromptCount() {
  promptCount.textContent = `${generationPromptInput.value.length} / ${generationPromptInput.maxLength}`;
}

function cleanGeneratedCode(code) {
  const trimmedCode = code.trim();
  const fencedCode = trimmedCode.match(/^```[^\r\n]*\r?\n([\s\S]*?)\r?\n```$/);
  return fencedCode ? fencedCode[1] : trimmedCode;
}

function highlightGeneratedCode(code, prompt) {
  const requestedLanguage = [
    [/\b(?:javascript|node\.?js)\b/i, "javascript"],
    [/\btypescript\b/i, "typescript"],
    [/\bpython\b/i, "python"],
    [/\bc\+\+|\bcpp\b/i, "cpp"],
    [/\bc#|\bcsharp\b/i, "csharp"],
    [/\bjava\b/i, "java"],
    [/\bgolang\b|\bgo\b/i, "go"],
    [/\bphp\b/i, "php"],
    [/\bsql\b/i, "sql"],
  ].find(([pattern]) => pattern.test(prompt))?.[1];

  return requestedLanguage && syntaxHighlighter.getLanguage(requestedLanguage)
    ? syntaxHighlighter.highlight(code, { language: requestedLanguage }).value
    : syntaxHighlighter.highlightAuto(code).value;
}

async function generateCode() {
  const prompt = generationPromptInput.value.trim();
  setElementMessage(generatorMessage, "");

  if (!prompt) {
    setElementMessage(generatorMessage, "Describe the code you want generated.");
    generationPromptInput.focus();
    return;
  }

  setGenerationLoading(true);
  const pre = document.createElement("pre");
  pre.className = "generated-code";
  const code = document.createElement("code");
  pre.append(code);
  let streamedCode = "";
  try {
    const result = await streamOllama("/api/generate", { prompt }, (token) => {
      streamedCode += token;
      if (!pre.isConnected) generatorResultContent.append(pre);
      generatorLoadingState.hidden = true;
      code.textContent = streamedCode;
    });

    latestGeneratedCode = cleanGeneratedCode(result.content);
    code.innerHTML = highlightGeneratedCode(latestGeneratedCode, prompt);
    copyGeneratedCodeButton.disabled = false;
    setElementMessage(generatorMessage, performanceMessage(result.stats, "Code generated"), "success");
  } catch (error) {
    pre.remove();
    generatorResultContent.querySelector(".generated-code, .error-panel")?.remove();
    const errorPanel = document.createElement("div");
    errorPanel.className = "error-panel";
    errorPanel.setAttribute("role", "alert");
    errorPanel.textContent = error instanceof TypeError
      ? "Could not reach the app server. Make sure it is running and try again."
      : error.message;
    generatorResultContent.append(errorPanel);
    copyGeneratedCodeButton.disabled = true;
    setElementMessage(generatorMessage, "We couldn't generate that code.");
  } finally {
    setGenerationLoading(false);
  }
}

function updateTranslationLanguage() {
  const language = translationLanguages[sourceLanguageSelect.value];
  sourceFileName.textContent = `source.${language.extension}`;
  sourceLanguageTag.textContent = language.tag;
}

function updateTranslationCodeCount() {
  const length = translationInput.value.length;
  translatorCodeCount.textContent = `${length} ${length === 1 ? "character" : "characters"}`;
}

function setTranslationLoading(isLoading) {
  translateButton.disabled = isLoading;
  clearTranslationButton.disabled = isLoading;
  translationInput.disabled = isLoading;
  sourceLanguageSelect.disabled = isLoading;
  targetLanguageSelect.disabled = isLoading;
  translateButton.querySelector(".button-label").textContent = isLoading ? "Translating..." : "Translate code";
  translateButton.querySelector(".button-loader").hidden = !isLoading;
  translatorResultPanel.setAttribute("aria-busy", String(isLoading));
  translatorLoadingState.hidden = !isLoading;
  if (isLoading) {
    translatorEmptyState.hidden = true;
  }
}

async function translateCode() {
  const code = translationInput.value.trim();
  const sourceLanguage = translationLanguages[sourceLanguageSelect.value].name;
  const targetLanguage = translationLanguages[targetLanguageSelect.value].name;
  setElementMessage(translatorMessage, "");
  latestTranslatedCode = "";
  translatorResultContent.querySelector(".translated-code, .error-panel")?.remove();
  translatorEmptyState.hidden = false;
  copyTranslatedCodeButton.disabled = true;

  if (!code) {
    setElementMessage(translatorMessage, "Add some source code before translating.");
    translationInput.focus();
    return;
  }
  if (sourceLanguage === targetLanguage) {
    setElementMessage(translatorMessage, "Choose different source and target languages.");
    targetLanguageSelect.focus();
    return;
  }

  setTranslationLoading(true);
  const pre = document.createElement("pre");
  pre.className = "translated-code";
  const output = document.createElement("code");
  output.className = `language-${targetLanguageSelect.value}`;
  pre.append(output);
  let streamedCode = "";
  try {
    const result = await streamOllama("/api/translate", { code, sourceLanguage, targetLanguage }, (token) => {
      streamedCode += token;
      if (!pre.isConnected) translatorResultContent.append(pre);
      translatorLoadingState.hidden = true;
      output.textContent = streamedCode;
    });

    latestTranslatedCode = cleanGeneratedCode(result.content);
    output.innerHTML = syntaxHighlighter.highlight(latestTranslatedCode, { language: targetLanguageSelect.value }).value;
    copyTranslatedCodeButton.disabled = false;
    setElementMessage(translatorMessage, performanceMessage(result.stats, `Code translated to ${targetLanguage}`), "success");
  } catch (error) {
    pre.remove();
    translatorResultContent.querySelector(".translated-code, .error-panel")?.remove();
    const errorPanel = document.createElement("div");
    errorPanel.className = "error-panel";
    errorPanel.setAttribute("role", "alert");
    errorPanel.textContent = error instanceof TypeError
      ? "Could not reach the app server. Make sure it is running and try again."
      : error.message;
    translatorResultContent.append(errorPanel);
    copyTranslatedCodeButton.disabled = true;
    setElementMessage(translatorMessage, "We couldn't translate that code.");
  } finally {
    setTranslationLoading(false);
  }
}

codeInput.addEventListener("input", updateCodeCount);
exampleSelect.addEventListener("change", () => {
  if (!exampleSelect.value) return;
  codeInput.value = examples[exampleSelect.value];
  updateCodeCount();
  setMessage("");
  codeInput.focus();
});
explainButton.addEventListener("click", explainCode);
clearButton.addEventListener("click", () => {
  codeInput.value = "";
  exampleSelect.value = "";
  updateCodeCount();
  latestExplanation = "";
  resultContent.querySelector(".explanation, .error-panel")?.remove();
  emptyState.hidden = false;
  copyExplanationButton.disabled = true;
  setMessage("");
  codeInput.focus();
});
copyCodeButton.addEventListener("click", () => copyText(codeInput.value, "Code copied to clipboard."));
copyExplanationButton.addEventListener("click", () => copyText(latestExplanation, "Explanation copied to clipboard."));
generationPromptInput.addEventListener("input", updatePromptCount);
generateButton.addEventListener("click", generateCode);
clearGenerationButton.addEventListener("click", () => {
  generationPromptInput.value = "";
  latestGeneratedCode = "";
  updatePromptCount();
  generatorResultContent.querySelector(".generated-code, .error-panel")?.remove();
  generatorEmptyState.hidden = false;
  copyGeneratedCodeButton.disabled = true;
  setElementMessage(generatorMessage, "");
  generationPromptInput.focus();
});
copyGeneratedCodeButton.addEventListener("click", () => copyText(latestGeneratedCode, "Generated code copied to the clipboard.", generatorMessage));
translationInput.addEventListener("input", updateTranslationCodeCount);
sourceLanguageSelect.addEventListener("change", updateTranslationLanguage);
translateButton.addEventListener("click", translateCode);
clearTranslationButton.addEventListener("click", () => {
  translationInput.value = "";
  latestTranslatedCode = "";
  updateTranslationCodeCount();
  translatorResultContent.querySelector(".translated-code, .error-panel")?.remove();
  translatorEmptyState.hidden = false;
  copyTranslatedCodeButton.disabled = true;
  setElementMessage(translatorMessage, "");
  translationInput.focus();
});
copyTranslatedCodeButton.addEventListener("click", () => copyText(latestTranslatedCode, "Translated code copied to the clipboard.", translatorMessage));

updateCodeCount();
updatePromptCount();
updateTranslationLanguage();
updateTranslationCodeCount();