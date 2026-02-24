/**
 * 音频格式转换工具
 */

export async function convertWebmToWav(webmBlob: Blob, sampleRate: number = 16000): Promise<Blob> {
  const arrayBuffer = await webmBlob.arrayBuffer();
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  const offlineContext = new OfflineAudioContext(1, audioBuffer.length * sampleRate / audioBuffer.sampleRate, sampleRate);
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineContext.destination);
  source.start();
  
  const renderedBuffer = await offlineContext.startRendering();
  const wavBuffer = audioBufferToWav(renderedBuffer, sampleRate);
  
  return new Blob([wavBuffer], { type: 'audio/wav' });
}

function audioBufferToWav(buffer: AudioBuffer, sampleRate: number): ArrayBuffer {
  const numChannels = 1;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = buffer.length * blockAlign;
  const bufferSize = 44 + dataSize;
  
  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);
  
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 8 * bytesPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);
  
  const channelData = buffer.getChannelData(0);
  let offset = 44;
  
  for (let i = 0; i < channelData.length; i++) {
    const sample = Math.max(-1, Math.min(1, channelData[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    offset += 2;
  }
  
  return arrayBuffer;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
