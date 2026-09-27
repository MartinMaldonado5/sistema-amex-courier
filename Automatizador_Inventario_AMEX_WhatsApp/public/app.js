'use strict';

const form = document.getElementById('upload-form');
const fields = ['inventory', 'delivered', 'sent', 'received'];
const SOURCES = ['delivered', 'sent', 'received'];
const SOURCE_LABELS = { delivered: 'ENTREGADO', sent: 'ENVIADO', received: 'RECIBIDO' };
const button = document.getElementById('process-button');
const countLabel = document.getElementById('file-count');
const errorBox = document.getElementById('error-box');
const processing = document.getElementById('processing');
const processingTimerLabel = document.getElementById('processing-timer');
const processingStageLabel = document.getElementById('processing-stage');
const processingSteps = [...document.querySelectorAll('[data-processing-stage]')];
const processingValidations = document.getElementById('processing-validations');
const results = document.getElementById('results');
const storagePanel = document.getElementById('storage-panel');
const storageToggle = document.getElementById('storage-toggle');
const storageTotal = document.getElementById('storage-total');
const storageRunCount = document.getElementById('storage-run-count');
const storageMessage = document.getElementById('storage-message');
const storageRunList = document.getElementById('storage-run-list');
const storageEmpty = document.getElementById('storage-empty');
let processingStartedAt = null;
let processingTimer = null;
let progressPoll = null;
let progressRequestPending = false;
let renderedValidationKey = '';

function getSelectedSources() {
  return SOURCES.filter((name) => {
    const toggle = document.getElementById(`use-${name}`);
    return toggle ? toggle.checked : true;
  });
}

function refreshSelection() {
  const selectedSources = getSelectedSources();
  const requiredInputs = ['inventory', ...selectedSources];
  let selected = 0;
  for (const name of fields) {
    const input = document.getElementById(name);
    const card = input.closest('.file-card');
    const label = document.getElementById(`name-${name}`);
    const isSource = SOURCES.includes(name);
    const enabled = !isSource || selectedSources.includes(name);
    if (card) card.classList.toggle('is-disabled', !enabled);
    if (input) input.disabled = !enabled;
    if (!enabled) {
      if (input && input.files.length > 0) input.value = '';
      if (label) label.textContent = 'Fuente desactivada: actívala arriba para usarla';
      if (card) card.classList.remove('has-file');
      continue;
    }
    if (input.files.length > 0) {
      selected += 1;
      label.textContent = `${input.files[0].name} · ${formatSize(input.files[0].size)}`;
      card.classList.add('has-file');
    } else {
      label.textContent = 'Selecciona un archivo .xlsx';
      card.classList.remove('has-file');
    }
  }
  const total = requiredInputs.length;
  countLabel.textContent = `${selected} de ${total} archivos`;
  const hasInventory = document.getElementById('inventory').files.length > 0;
  const sourcesOk = selectedSources.length > 0 && selectedSources.every((name) => document.getElementById(name).files.length > 0);
  button.disabled = !(hasInventory && sourcesOk);
  if (selectedSources.length === 0) {
    countLabel.textContent = 'Activa al menos una fuente TIB';
  }
}

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatElapsedTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value) => String(value).padStart(2, '0');
  return hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
}

function formatStorage(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatSeconds(seconds) {
  return Number.isFinite(seconds) ? `${seconds.toLocaleString('es-PE', { maximumFractionDigits: 2 })} s` : '—';
}

function renderInputValidations(list, validations = []) {
  const validationKey = JSON.stringify(validations);
  if (list === processingValidations && validationKey === renderedValidationKey) return;
  if (list === processingValidations) renderedValidationKey = validationKey;
  list.replaceChildren();
  for (const validation of validations) {
    const item = document.createElement('li');
    const heading = document.createElement('strong');
    heading.textContent = `${validation.fileName} · hoja «${validation.worksheetName}» · encabezados en fila ${validation.headerRow}`;
    const columns = document.createElement('small');
    columns.textContent = (validation.headers || []).map((header) => `${header.name} (${header.column})`).join(' · ');
    item.append(heading, columns);
    list.appendChild(item);
  }
  list.classList.toggle('hidden', validations.length === 0);
}

function updateProcessingTimer() {
  if (processingStartedAt === null) return;
  const elapsed = Math.floor((Date.now() - processingStartedAt) / 1000);
  processingTimerLabel.textContent = `Tiempo transcurrido: ${formatElapsedTime(elapsed)}`;
}

function startProcessingTimer() {
  processingStartedAt = Date.now();
  updateProcessingTimer();
  processingTimer = window.setInterval(updateProcessingTimer, 1000);
}

function stopProcessingTimer() {
  if (processingTimer !== null) {
    window.clearInterval(processingTimer);
    processingTimer = null;
  }
  if (processingStartedAt === null) return 0;
  const elapsed = Math.floor((Date.now() - processingStartedAt) / 1000);
  processingStartedAt = null;
  return elapsed;
}

function updateProcessingProgress(progress) {
  const currentIndex = processingSteps.findIndex((step) => step.dataset.processingStage === progress.stage);
  const finished = progress.stage === 'complete';
  for (let index = 0; index < processingSteps.length; index += 1) {
    const step = processingSteps[index];
    const done = finished || (currentIndex >= 0 && index < currentIndex);
    const current = !finished && index === currentIndex;
    step.classList.toggle('is-complete', done);
    step.classList.toggle('is-current', current);
    if (current) step.setAttribute('aria-current', 'step');
    else step.removeAttribute('aria-current');
    step.firstElementChild.textContent = done ? '✓' : String(index + 1);
  }
  if (progress.message) processingStageLabel.textContent = progress.message;
  renderInputValidations(processingValidations, progress.validations || []);
}

async function refreshProcessingProgress() {
  if (progressRequestPending) return;
  progressRequestPending = true;
  try {
    const response = await fetch('/api/progress', { cache: 'no-store' });
    if (response.ok) updateProcessingProgress(await response.json());
  } catch {
    // Keep the current stage visible if a poll is briefly interrupted.
  } finally {
    progressRequestPending = false;
  }
}

function startProgressPolling() {
  stopProgressPolling();
  const selectedSources = getSelectedSources();
  const labels = selectedSources.map((name) => SOURCE_LABELS[name]).join(', ') || 'ninguna fuente';
  updateProcessingProgress({ stage: 'receiving', message: `Recibiendo inventario + ${selectedSources.length} TIB (${labels}).` });
  void refreshProcessingProgress();
  progressPoll = window.setInterval(() => void refreshProcessingProgress(), 350);
}

function stopProgressPolling() {
  if (progressPoll !== null) {
    window.clearInterval(progressPoll);
    progressPoll = null;
  }
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove('hidden');
}

function fillList(element, values, formatter) {
  element.replaceChildren();
  for (const value of values) {
    const item = document.createElement('li');
    item.textContent = formatter(value);
    element.appendChild(item);
  }
}

function showResult(result, elapsedSeconds) {
  document.getElementById('stat-matched').textContent = result.matched.toLocaleString('es-PE');
  document.getElementById('stat-total').textContent = `de ${result.totalInventory.toLocaleString('es-PE')} guías`;
  const unmatchedCount = result.unmatchedCount ?? result.unmatched?.length ?? 0;
  const unmatchedSample = result.unmatchedSample ?? result.unmatched ?? [];
  document.getElementById('stat-unmatched').textContent = unmatchedCount.toLocaleString('es-PE');
  document.getElementById('stat-source').textContent = result.sourceRows.toLocaleString('es-PE');
  document.getElementById('stat-duplicates').textContent = result.duplicateRows.toLocaleString('es-PE');
  document.getElementById('download-link').href = result.downloadUrl;
  document.getElementById('result-duration').textContent = `Tiempo total: ${formatElapsedTime(elapsedSeconds)}`;
  const usedSources = result.selectedSourceLabels || result.selectedSources || [];
  const sourcesLine = document.getElementById('result-sources');
  if (sourcesLine) {
    sourcesLine.textContent = usedSources.length > 0
      ? `Fuentes cruzadas: ${usedSources.join(' · ')}`
      : '';
  }
  const sourceHint = document.getElementById('stat-source-hint');
  if (sourceHint) {
    const n = usedSources.length;
    sourceHint.textContent = n === 1 ? 'en 1 fuente activada' : `en ${n} fuentes activadas`;
  }
  renderInputValidations(document.getElementById('input-validation-list'), result.inputValidations || []);
  document.getElementById('diag-processing-time').textContent = formatSeconds(result.processingSeconds);
  document.getElementById('diag-cpu-time').textContent = formatSeconds(result.cpuSeconds);
  document.getElementById('diag-memory').textContent = Number.isFinite(result.peakWorkingSetMb)
    ? `${result.peakWorkingSetMb.toLocaleString('es-PE', { maximumFractionDigits: 1 })} MB`
    : '—';
  const stageNames = {
    validating: 'Validación de los archivos',
    'reading-delivered': 'Lectura de ENTREGADO TIB',
    'reading-sent': 'Lectura de ENVIADO TIB',
    'reading-received': 'Lectura de RECIBIDO TIB',
    'validating-inventory': 'Validación del inventario',
    matching: 'Cruce y escritura de filas',
    verifying: 'Verificación y guardado',
  };
  const stageTimings = document.getElementById('stage-timings');
  stageTimings.replaceChildren();
  for (const [stage, seconds] of Object.entries(result.stageSeconds || {})) {
    const item = document.createElement('li');
    const label = document.createElement('span');
    const value = document.createElement('strong');
    label.textContent = stageNames[stage] || stage;
    value.textContent = formatSeconds(seconds);
    item.append(label, value);
    stageTimings.appendChild(item);
  }

  const unmatchedPanel = document.getElementById('unmatched-panel');
  const unmatchedList = document.getElementById('unmatched-list');
  const unmatchedDownload = document.getElementById('unmatched-download');
  if (unmatchedCount > 0) {
    const displayRows = unmatchedSample.slice(0, 500);
    fillList(unmatchedList, displayRows, (row) => `${row.wr} · fila ${row.row}`);
    if (unmatchedCount > displayRows.length) {
      const item = document.createElement('li');
      item.textContent = `y ${unmatchedCount - displayRows.length} guías más`;
      unmatchedList.appendChild(item);
    }
    document.getElementById('unmatched-count').textContent = `(${unmatchedCount.toLocaleString('es-PE')})`;
    if (result.unmatchedReportUrl) {
      unmatchedDownload.href = result.unmatchedReportUrl;
      unmatchedDownload.classList.remove('hidden');
    } else {
      unmatchedDownload.classList.add('hidden');
    }
    unmatchedPanel.classList.remove('hidden');
  } else {
    unmatchedDownload.classList.add('hidden');
    unmatchedPanel.classList.add('hidden');
  }

  const duplicatePanel = document.getElementById('duplicate-panel');
  const duplicateList = document.getElementById('duplicate-list');
  if (result.duplicateWRs && result.duplicateWRs.length) {
    fillList(duplicateList, result.duplicateWRs, (row) => `${row.wr} · ${row.rows} registros · se usó ${row.chosenSource}`);
    if (result.duplicateRows > result.duplicateWRs.length) {
      const item = document.createElement('li');
      item.textContent = 'El detalle está limitado a los primeros 200 WR repetidos.';
      duplicateList.appendChild(item);
    }
    duplicatePanel.classList.remove('hidden');
  } else {
    duplicatePanel.classList.add('hidden');
  }

  results.classList.remove('hidden');
  results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function formatRunDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Fecha desconocida' : date.toLocaleString('es-PE');
}

async function removeSavedRun(run) {
  if (run.active) return;
  const date = formatRunDate(run.createdAt);
  if (!window.confirm(`¿Eliminar la ejecución del ${date}? Se borrarán las copias cargadas y los resultados de esta ejecución. Los Excel originales no se modificarán.`)) return;

  storageMessage.textContent = 'Eliminando ejecución…';
  try {
    const response = await fetch(`/api/runs/${run.id}`, { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'No se pudo eliminar la ejecución.');
    await loadRunStorage();
  } catch (error) {
    storageMessage.textContent = error.message || 'No se pudo eliminar la ejecución.';
  }
}

async function loadRunStorage() {
  storageMessage.textContent = 'Calculando el espacio utilizado…';
  try {
    const response = await fetch('/api/runs', { cache: 'no-store' });
    const storage = await response.json();
    if (!response.ok) throw new Error(storage.error || 'No se pudo leer el almacenamiento.');
    storageTotal.textContent = formatStorage(storage.totalBytes);
    storageRunCount.textContent = `${storage.runCount} ${storage.runCount === 1 ? 'ejecución' : 'ejecuciones'}`;
    storageMessage.textContent = '';
    storageRunList.replaceChildren();
    storageEmpty.classList.toggle('hidden', storage.runs.length !== 0);

    for (const run of storage.runs) {
      const item = document.createElement('li');
      item.className = 'storage-run';
      const info = document.createElement('div');
      info.className = 'storage-run-info';
      const date = document.createElement('strong');
      date.textContent = formatRunDate(run.createdAt);
      const summary = document.createElement('small');
      const status = run.active ? 'En procesamiento' : run.outputReady ? 'Excel completado' : 'Ejecución incompleta';
      summary.textContent = `${formatStorage(run.sizeBytes)} · ${run.fileCount} archivos · ${status}`;
      info.append(date, summary);

      const removeButton = document.createElement('button');
      removeButton.className = 'storage-delete';
      removeButton.type = 'button';
      removeButton.textContent = run.active ? 'En uso' : 'Eliminar';
      removeButton.disabled = run.active;
      removeButton.addEventListener('click', () => void removeSavedRun(run));
      item.append(info, removeButton);
      storageRunList.appendChild(item);
    }
  } catch (error) {
    storageMessage.textContent = error.message || 'No se pudo leer el almacenamiento.';
    storageEmpty.classList.add('hidden');
  }
}

for (const name of fields) document.getElementById(name).addEventListener('change', refreshSelection);
for (const name of SOURCES) {
  const toggle = document.getElementById(`use-${name}`);
  if (toggle) toggle.addEventListener('change', refreshSelection);
}

const PRESETS = {
  all: ['delivered', 'sent', 'received'],
  'sent-received': ['sent', 'received'],
  delivered: ['delivered'],
  sent: ['sent'],
  received: ['received'],
};
for (const presetButton of document.querySelectorAll('[data-preset]')) {
  presetButton.addEventListener('click', () => {
    const wanted = PRESETS[presetButton.dataset.preset] || PRESETS.all;
    for (const name of SOURCES) {
      document.getElementById(`use-${name}`).checked = wanted.includes(name);
    }
    refreshSelection();
  });
}

storageToggle.addEventListener('click', () => {
  const opening = storagePanel.classList.contains('hidden');
  storagePanel.classList.toggle('hidden', !opening);
  storageToggle.setAttribute('aria-expanded', String(opening));
  if (opening) {
    void loadRunStorage();
    storagePanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorBox.classList.add('hidden');
  results.classList.add('hidden');
  processing.classList.remove('hidden');
  startProcessingTimer();
  startProgressPolling();
  button.disabled = true;
  button.querySelector('span:first-child').textContent = 'Procesando...';

  try {
    const selectedSources = getSelectedSources();
    if (selectedSources.length === 0) {
      showError('Activa al menos una fuente TIB (entregado, enviado o recibido).');
      return;
    }
    const payload = new FormData();
    payload.append('sources', JSON.stringify(selectedSources));
    payload.append('inventory', document.getElementById('inventory').files[0]);
    for (const name of selectedSources) {
      payload.append(name, document.getElementById(name).files[0]);
    }
    const response = await fetch('/api/process', { method: 'POST', body: payload });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'No se pudo completar el inventario.');
    const elapsed = stopProcessingTimer();
    showResult(result, elapsed);
  } catch (error) {
    showError(error.message || 'Ocurrió un error al procesar los archivos.');
  } finally {
    stopProgressPolling();
    stopProcessingTimer();
    processing.classList.add('hidden');
    button.querySelector('span:first-child').textContent = 'Completar inventario';
    refreshSelection();
  }
});

refreshSelection();
