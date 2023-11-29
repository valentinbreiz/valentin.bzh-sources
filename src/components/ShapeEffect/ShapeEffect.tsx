import React, { useCallback, useEffect, useRef, useState } from 'react';
import tw from 'twin.macro';

import { Circle, Rectangle, Shape, Triangle } from './shapes';

const Canvas = tw.canvas`w-full h-full opacity-0 transition-opacity duration-300`;

const visible = tw`opacity-100`;

const Shapes = [Triangle, Rectangle, Circle];

// https://tailwindcss.com/docs/customizing-colors
const colors = [
  // '#71717a',
  // '#737373',
  // '#78716c',
  // '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#0ea5e9',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
];

export type ShapeEffectProps = {
  count: number;
  sizes: [min: number, max: number];
};

type SyntaxType = 'keywords' | 'operators' | 'numbers' | 'default';

const syntaxRules: Record<SyntaxType, string[]> = {
  keywords: ['push', 'mov', 'out', 'cld', 'rep', 'jmp', 'use32', "sidt", "sgdt", "and", "lea"],
  operators: ['+', '-', '*', '/', '='],
  numbers: [], // Les nombres seront gérés séparément
  default: [],
};

const syntaxColors: Record<SyntaxType, string> = {
  keywords: '#ec4899',
  operators: '#1E90FF',
  numbers: '#ec4899', // Bleu pour les nombres
  default: '#94a3b8',
};

interface CodeSegment {
  type: SyntaxType;
  value: string;
}

function isNumeric(value: string): boolean {
  return /^0x[0-9A-Fa-f]+$|^\d+$/.test(value); // Reconnaît les nombres décimaux et hexadécimaux
}

function parseCodeLine(text: string): CodeSegment[] {
  const words = text.split(' ');
  return words.map(word => {
    if (isNumeric(word)) {
      return { type: 'numbers', value: word };
    }
    for (let type in syntaxRules) {
      if (syntaxRules[type as SyntaxType].includes(word)) {
        return { type: type as SyntaxType, value: word };
      }
    }
    return { type: 'default', value: word };
  });
}

// Exemple de lignes de code assembleur x86
const assemblerCode = [
  "push ax",
  "mov  al, 0x11",
  "out  0x20, al",
  "out  0xA0, al",
  "mov  al, bh",
  "mov  esi, reloc:",
  "mov  ecx, (int32_end - reloc)",
  "cld",
  "rep  movsb",
  "jmp INT32_BASE",
  "reloc: use32",
  "mov  [REBASE(stack32_ptr)], esp",
  "sidt [REBASE(idt32_ptr)]",
  "jmp  word 0x0000:REBASE(r_mode16)",
  "mov  bx, 0x0870",
  "lea  edi, [esp+0x28]",
  "and  al,  ~0x01",
];

class CodeLine {
  x: number;
  y: number;
  text: string;
  speed: number;
  fontSize: number; // Nouvelle propriété pour la taille de la police

  constructor(x: number, y: number, text: string, speed: number = 1, fontSize: number = 16) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.speed = speed;
    this.fontSize = fontSize; // Initialisation de la taille de la police
  }

  move() {
    this.x += this.speed;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.font = `${this.fontSize}px monospace`; // Utilisation de la taille de la police
    let offsetX = this.x;
    const segments = parseCodeLine(this.text);
    segments.forEach(segment => {
      ctx.fillStyle = syntaxColors[segment.type];
      ctx.fillText(segment.value, offsetX, this.y);
      offsetX += ctx.measureText(segment.value).width + ctx.measureText(' ').width;
    });
  }
}

const ShapeEffect = ({ count, sizes }: { count: number, sizes: [number, number] }) => {
  const [mounted, setMounted] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const codeLines = useRef<CodeLine[]>([]);

  // Logique pour redimensionner le canvas
  const resize = useCallback(() => {
    if (!canvas.current) return;

    const rect = canvas.current.getBoundingClientRect();
    canvas.current.width = rect.width;
    canvas.current.height = rect.height;
  }, []);

  // Logique pour remplir le canvas avec des lignes de code
  const fill = useCallback(() => {
    if (!canvas.current) return;
    const ctxWidth = canvas.current.width;
    const ctxHeight = canvas.current.height;
    const firstTime = codeLines.current.length === 0;

    while (codeLines.current.length < count) {
      const text = assemblerCode[Math.floor(Math.random() * assemblerCode.length)];
      const x = firstTime ? Math.random() * ctxWidth : -200;
      const y = Math.random() * ctxHeight;
      const speed = 0.2 + Math.random() * 1.5;
      const fontSize = 12 + Math.random() * 10; // Taille de police aléatoire entre 12 et 22
    
      codeLines.current.push(new CodeLine(x, y, text, speed, fontSize));
    }
  }, [count, sizes]);

  // Logique pour dessiner les lignes de code
  const draw = useCallback(() => {
    if (!canvas.current) return;
    const ctx = canvas.current.getContext('2d')!;
    const ctxWidth = canvas.current.width;
    const ctxHeight = canvas.current.height;

    ctx.clearRect(0, 0, ctxWidth, ctxHeight);
    ctx.fillStyle = '#fff'; // Couleur du texte
    ctx.font = '16px monospace'; // Style du texte

    codeLines.current.forEach((line) => {
      line.move();
      line.draw(ctx);
    });

    codeLines.current = codeLines.current.filter((line) => line.x - 200 < ctxWidth);
  }, []);

  // Boucle de rendu
  const tick = useCallback(() => {
    fill();
    draw();
    requestAnimationFrame(tick);
  }, [fill, draw]);

  useEffect(() => {
    resize();
    tick();
    setMounted(true);
    window.addEventListener('resize', resize);

    return () => window.removeEventListener('resize', resize);
  }, [resize, tick]);

  return <Canvas ref={canvas} css={[mounted && visible]} />;
};

export default ShapeEffect;