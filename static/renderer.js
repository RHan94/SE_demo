const form = document.getElementById('prompt-form');
const promptField = document.getElementById('prompt');
const generateButton = document.getElementById('generate-button');
const statusLabel = document.getElementById('status');
const diagramTitle = document.getElementById('diagram-title');
const diagramType = document.getElementById('diagram-type');
const diagramContainer = document.getElementById('diagram-container');
const explanationSection = document.getElementById('explanation');
const mermaidCodeElement = document.getElementById('mermaid-code');
const copyButton = document.getElementById('copy-button');
const mermaidCodeBlock = document.getElementById('mermaid-code-block');
const navButtons = document.querySelectorAll('.nav-button');
const pages = document.querySelectorAll('.page');
const codeLanguageBadge = document.getElementById('code-language-badge');
const generateCodeButton = document.getElementById('generate-code-button');
const codeStatusLabel = document.getElementById('code-status');
const codeExplanationSection = document.getElementById('code-explanation');
const generatedCodeBlock = document.getElementById('generated-code-block');
const generatedCodeElement = document.getElementById('generated-code');
const copyGeneratedCodeButton = document.getElementById('copy-generated-code-button');
const codeHint = document.getElementById('code-hint');

const mermaidConfig = { startOnLoad: false, theme: 'dark' };
if (window.mermaid) {
  window.mermaid.initialize(mermaidConfig);
}

let lastPrompt = '';
let latestUmlResult = null;
let latestCodeResult = null;

const setDiagramStatus = (text, variant = 'info') => {
  statusLabel.textContent = text ?? '';
  statusLabel.dataset.variant = variant;
};

const setCodeStatus = (text, variant = 'info') => {
  codeStatusLabel.textContent = text ?? '';
  codeStatusLabel.dataset.variant = variant;
};

const toggleDiagramLoadingState = (isLoading) => {
  generateButton.disabled = isLoading;
  setDiagramStatus(isLoading ? 'Generating UML diagram...' : '', 'info');
};

const toggleCodeLoadingState = (isLoading) => {
  generateCodeButton.disabled = isLoading;
  setCodeStatus(isLoading ? 'Generating implementation from UML...' : '', 'info');
};

const updateCodeHint = () => {
  if (!codeHint) {
    return;
  }

  if (latestUmlResult) {
    codeHint.textContent = 'UML 圖表已就緒，可立即生成對應程式碼。';
  } else {
    codeHint.textContent = '先在 UML 頁面產生圖表，再回到這裡生成對應的程式碼。';
  }
};

const displayDiagramMessage = (message) => {
  diagramContainer.innerHTML = '';
  const placeholder = document.createElement('div');
  placeholder.className = 'placeholder';
  placeholder.textContent = message;
  diagramContainer.appendChild(placeholder);
};

const clearDiagramContainer = () => {
  displayDiagramMessage('Submit a prompt to see the generated UML diagram.');
};

const resetCodeView = () => {
  latestCodeResult = null;
  if (codeLanguageBadge) {
    codeLanguageBadge.textContent = '';
    codeLanguageBadge.classList.add('hidden');
  }
  if (codeExplanationSection) {
    codeExplanationSection.textContent = '';
    codeExplanationSection.classList.add('hidden');
  }
  if (generatedCodeElement) {
    generatedCodeElement.textContent = '';
  }
  if (generatedCodeBlock) {
    generatedCodeBlock.classList.add('hidden');
  }
  setCodeStatus('', 'info');
};

const renderMermaidDiagram = async (code) => {
  if (!window.mermaid) {
    throw new Error('Mermaid library failed to load.');
  }

  const safeCode = code.trim();
  if (!safeCode) {
    throw new Error('Diagram code is empty.');
  }

  const renderId = `uml-diagram-${Date.now()}`;

  try {
    const { svg } = await window.mermaid.render(renderId, safeCode);
    diagramContainer.innerHTML = svg;
  } catch (error) {
    console.error('Mermaid rendering failed', error, safeCode);
    const message = error instanceof Error ? error.message : 'Unknown Mermaid rendering error.';
    throw new Error(`Unable to render Mermaid diagram: ${message}`);
  }
};

const setDiagramResult = (result) => {
  diagramTitle.textContent = result.diagramTitle ?? 'Architecture Diagram';
  diagramType.textContent = result.diagramType ?? '';
  diagramType.classList.toggle('hidden', !result.diagramType);

  explanationSection.textContent = result.explanation ?? '';
  explanationSection.classList.toggle('hidden', !result.explanation);

  const code = result.diagramCode ?? '';
  mermaidCodeElement.textContent = code;
  mermaidCodeBlock.classList.toggle('hidden', !code);

  if (code && result.diagramType) {
    latestUmlResult = result;
  } else {
    latestUmlResult = null;
  }

  resetCodeView();
  updateCodeHint();
};

const setCodeResult = (result) => {
  latestCodeResult = result;

  if (codeLanguageBadge) {
    codeLanguageBadge.textContent = result.language ?? '';
    codeLanguageBadge.classList.toggle('hidden', !(result.language && result.language.trim()));
  }

  if (codeExplanationSection) {
    const explanation = result.explanation ?? '';
    codeExplanationSection.textContent = explanation;
    codeExplanationSection.classList.toggle('hidden', !explanation.trim());
  }

  if (generatedCodeElement && generatedCodeBlock) {
    const code = result.code ?? '';
    generatedCodeElement.textContent = code;
    generatedCodeBlock.classList.toggle('hidden', !code.trim());
  }
};

const navigateTo = (pageName) => {
  pages.forEach((page) => {
    const isActive = page.dataset.page === pageName;
    page.classList.toggle('page-active', isActive);
  });

  navButtons.forEach((button) => {
    const isTarget = button.dataset.target === pageName;
    button.classList.toggle('nav-button-active', isTarget);
  });
};

clearDiagramContainer();
setDiagramResult({ diagramTitle: 'Diagram Preview', diagramType: '', diagramCode: '', explanation: '' });
navigateTo('diagram');
updateCodeHint();

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const prompt = promptField.value.trim();
  if (!prompt) {
    setDiagramStatus('Please enter a prompt first.', 'warning');
    return;
  }

  lastPrompt = prompt;
  toggleDiagramLoadingState(true);
  resetCodeView();
  updateCodeHint();

  try {
    const result = await window.api.generateUml(prompt);
    setDiagramResult(result);

    try {
      await renderMermaidDiagram(result.diagramCode);
      setDiagramStatus('Diagram generated successfully.', 'success');
    } catch (renderError) {
      console.error(renderError);
      displayDiagramMessage('Mermaid could not render the diagram. Check the Mermaid code below for syntax issues.');
      const message = renderError instanceof Error ? renderError.message : 'Mermaid rendering failed.';
      setDiagramStatus(`Mermaid syntax error: ${message}`, 'error');
    }
  } catch (error) {
    console.error(error);
    clearDiagramContainer();
    setDiagramResult({ diagramTitle: 'Diagram Preview', diagramType: '', diagramCode: '', explanation: '' });
    const message = error instanceof Error ? error.message : 'Failed to generate diagram.';
    setDiagramStatus(message, 'error');
  } finally {
    toggleDiagramLoadingState(false);
  }
});

copyButton.addEventListener('click', async () => {
  const code = mermaidCodeElement.textContent ?? '';
  if (!code.trim()) {
    setDiagramStatus('Nothing to copy yet.', 'warning');
    return;
  }

  try {
    await navigator.clipboard.writeText(code);
    setDiagramStatus('Mermaid code copied to clipboard.', 'success');
  } catch (error) {
    console.error(error);
    setDiagramStatus('Unable to copy to clipboard.', 'error');
  }
});

generateCodeButton.addEventListener('click', async () => {
  if (!latestUmlResult || !latestUmlResult.diagramCode) {
    setCodeStatus('尚未有可用的 UML 圖表，請先產生 UML。', 'warning');
    navigateTo('diagram');
    return;
  }

  toggleCodeLoadingState(true);

  try {
    const result = await window.api.generateCode({
      prompt: lastPrompt,
      diagramType: latestUmlResult.diagramType,
      diagramCode: latestUmlResult.diagramCode,
      explanation: latestUmlResult.explanation,
    });

    setCodeResult(result);
    setCodeStatus('Code generated successfully.', 'success');
  } catch (error) {
    console.error(error);
    resetCodeView();
    const message = error instanceof Error ? error.message : 'Failed to generate code.';
    setCodeStatus(message, 'error');
  } finally {
    toggleCodeLoadingState(false);
  }
});

copyGeneratedCodeButton.addEventListener('click', async () => {
  const code = generatedCodeElement.textContent ?? '';
  if (!code.trim()) {
    setCodeStatus('Nothing to copy yet.', 'warning');
    return;
  }

  try {
    await navigator.clipboard.writeText(code);
    setCodeStatus('Generated code copied to clipboard.', 'success');
  } catch (error) {
    console.error(error);
    setCodeStatus('Unable to copy to clipboard.', 'error');
  }
});

window.addEventListener('DOMContentLoaded', () => {
  promptField.focus();
});

navButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const target = button.dataset.target;
    if (target) {
      navigateTo(target);
    }
  });
});
