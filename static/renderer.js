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

const mermaidConfig = { startOnLoad: false, theme: 'dark' };
if (window.mermaid) {
  window.mermaid.initialize(mermaidConfig);
}

const setStatus = (text, variant = 'info') => {
  statusLabel.textContent = text ?? '';
  statusLabel.dataset.variant = variant;
};

const toggleLoadingState = (isLoading) => {
  generateButton.disabled = isLoading;
  setStatus(isLoading ? 'Generating UML diagram...' : '', 'info');
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

const applyResult = (result) => {
  diagramTitle.textContent = result.diagramTitle ?? 'Architecture Diagram';
  diagramType.textContent = result.diagramType ?? '';
  diagramType.classList.toggle('hidden', !result.diagramType);

  explanationSection.textContent = result.explanation ?? '';
  explanationSection.classList.toggle('hidden', !result.explanation);

  const code = result.diagramCode ?? '';
  mermaidCodeElement.textContent = code;
  mermaidCodeBlock.classList.toggle('hidden', !code);
};

clearDiagramContainer();
applyResult({ diagramTitle: 'Diagram Preview', diagramType: '', diagramCode: '', explanation: '' });

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const prompt = promptField.value.trim();
  if (!prompt) {
    setStatus('Please enter a prompt first.', 'warning');
    return;
  }

  toggleLoadingState(true);

  try {
    const result = await window.api.generateUml(prompt);
    applyResult(result);

    try {
      await renderMermaidDiagram(result.diagramCode);
      setStatus('Diagram generated successfully.', 'success');
    } catch (renderError) {
      console.error(renderError);
      displayDiagramMessage('Mermaid could not render the diagram. Check the Mermaid code below for syntax issues.');
      const message = renderError instanceof Error ? renderError.message : 'Mermaid rendering failed.';
      setStatus(`Mermaid syntax error: ${message}`, 'error');
    }
  } catch (error) {
    console.error(error);
    clearDiagramContainer();
    applyResult({ diagramTitle: 'Diagram Preview', diagramType: '', diagramCode: '', explanation: '' });
    const message = error instanceof Error ? error.message : 'Failed to generate diagram.';
    setStatus(message, 'error');
  } finally {
    toggleLoadingState(false);
  }
});

copyButton.addEventListener('click', async () => {
  const code = mermaidCodeElement.textContent ?? '';
  if (!code.trim()) {
    setStatus('Nothing to copy yet.', 'warning');
    return;
  }

  try {
    await navigator.clipboard.writeText(code);
    setStatus('Mermaid code copied to clipboard.', 'success');
  } catch (error) {
    console.error(error);
    setStatus('Unable to copy to clipboard.', 'error');
  }
});

window.addEventListener('DOMContentLoaded', () => {
  promptField.focus();
});