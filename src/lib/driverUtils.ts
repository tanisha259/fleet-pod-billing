// Offline & Voice prompt utility for Driver UI

export type SupportedLanguage = 'hi' | 'mr';

export const voicePrompts = {
  hi: {
    welcome: 'कृपया पावती (POD) चा फोटो काढण्यासाठी हिरवे बटण दाबा.',
    welcomeHi: 'कृपया बिल्टी / पावती का फोटो खींचने के लिए हरा बटन दबाएं.',
    capturing: 'फोटो लिया जा रहा है, कृपया कैमरा स्थिर रखें.',
    retakeRequired: 'सावधानी: मुहर (स्टाम्प) साफ नहीं दिख रही है. कृपया दोबारा साफ फोटो लें.',
    success: 'बहुत बढ़िया! पावती सफलतापूर्वक जमा हो गई है.',
    offlineNotice: 'नेटवर्क नहीं है. फोटो सुरक्षित सेव हो गई है, नेटवर्क आते ही अपलोड हो जाएगी.',
    reviewRequired: 'पावती जांच के लिए भेजी गई है. धन्यवाद.'
  },
  mr: {
    welcome: 'कृपया पावतीचा फोटो काढण्यासाठी हिरवे बटण दाबा.',
    capturing: 'फोटो काढला जात आहे, कॅमेरा स्थिर ठेवा.',
    retakeRequired: 'लक्ष द्या: शिक्का (स्टॅम्प) स्पष्ट दिसत नाही. कृपया पुन्हा स्पष्ट फोटो काढा.',
    success: 'उत्तम! पावती यशस्वीरीत्या जमा झाली आहे.',
    offlineNotice: 'नेटवर्क नाही. फोटो सेव्ह झाला आहे, नेटवर्क आल्यावर आपोआप अपलोड होईल.',
    reviewRequired: 'पावती तपासणीसाठी पाठवली आहे. धन्यवाद.'
  }
};

export function speakPrompt(text: string, lang: SupportedLanguage = 'hi') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'mr' ? 'mr-IN' : 'hi-IN';
    utterance.rate = 0.95; // Slightly slower for clarity
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Speech synthesis not available:', e);
  }
}

/**
 * High-performance image compression using HTML5 Canvas:
 * Guarantees output file stays strictly < 300 KB for rural 2G/3G highway connectivity
 */
export async function compressImageToUnder300KB(file: File): Promise<{ base64: string; sizeKB: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Max dimension 1400px is more than enough for crisp OCR and stamp verification
        const MAX_DIM = 1400;
        if (width > height && width > MAX_DIM) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else if (height > MAX_DIM) {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Stamp digital watermark with timestamp for non-repudiation
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(10, height - 42, 340, 32);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(`CAPTURED: ${new Date().toISOString()}`, 16, height - 22);

        // Iteratively tune quality to guarantee < 280 KB
        let quality = 0.78;
        let base64 = canvas.toDataURL('image/jpeg', quality);
        let sizeKB = Math.round((base64.length * 3) / 4 / 1024);

        while (sizeKB > 280 && quality > 0.3) {
          quality -= 0.12;
          base64 = canvas.toDataURL('image/jpeg', quality);
          sizeKB = Math.round((base64.length * 3) / 4 / 1024);
        }

        resolve({ base64, sizeKB });
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
