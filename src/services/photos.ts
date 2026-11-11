/**
 * Fotos de evolução. Demo: guardadas no navegador. Modo completo: servidor da academia
 * (só o aluno e a equipe veem). As fotos são reduzidas no aparelho antes de enviar.
 */
import { hub, type ProgressPhoto } from './hub';
import { REAL_BACKEND } from './openGymBackend';
import { localDay } from './extrasApi';

export type { ProgressPhoto };

const key = (studentId: string) => `gymapp.photos.${studentId}`;
const readDemo = (studentId: string): (ProgressPhoto & { data?: string })[] => {
  try {
    return JSON.parse(localStorage.getItem(key(studentId)) || '[]');
  } catch {
    return [];
  }
};

/** Reduz a foto para no máximo 900 px e JPEG (sem dados de localização: o canvas não copia o EXIF). */
export async function compressImage(file: File, max = 900, quality = 0.78): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Imagem inválida'));
      i.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export const photosApi = {
  async list(studentId: string): Promise<ProgressPhoto[]> {
    if (REAL_BACKEND) return hub.photos(studentId);
    return readDemo(studentId)
      .map((p) => ({ id: p.id, date: p.date, studentId, url: p.data ?? p.url }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },
  async add(studentId: string, dataUrl: string, date = localDay()): Promise<ProgressPhoto> {
    if (REAL_BACKEND) return hub.addPhoto(dataUrl, date);
    const p = { id: `ph-${Date.now()}`, date, studentId, url: '', data: dataUrl };
    const list = [...readDemo(studentId), p];
    try {
      localStorage.setItem(key(studentId), JSON.stringify(list));
    } catch {
      throw new Error('Sem espaço no navegador para mais fotos');
    }
    return { ...p, url: dataUrl };
  },
  async remove(studentId: string, id: string): Promise<void> {
    if (REAL_BACKEND) {
      await hub.deletePhoto(id);
      return;
    }
    localStorage.setItem(key(studentId), JSON.stringify(readDemo(studentId).filter((p) => p.id !== id)));
  },
};
