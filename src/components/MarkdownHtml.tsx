import { SANDBOX_TEMPLATES } from '@codesandbox/sandpack-react';
import MarkdownIt from 'markdown-it';
import React, { memo, useContext, useEffect, useRef, useState } from 'react';
import { Root, createRoot } from 'react-dom/client';
import tw, { styled } from 'twin.macro';
import "../styles.css"

import { DarkModeValueContext } from '../hooks/use-dark-mode';
import { highlight } from '../utils';
import Playground, { PlaygroundProps } from './Playground';

const Container = styled.div`
  ${tw`bg-transparent!`}

  > pre {
    ${tw`rounded shadow-md border border-gray-200 bg-white dark:bg-slate-800 dark:border-gray-800`}
  }
`;

const parseArgs = (raw: string): Record<string, string> => {
  const re = /(?<key>\w+)="(?<value>[^"]*)"/g;
  const args: Record<string, string> = {};

  for (const matched of raw.matchAll(re)) {
    const { key, value } = matched.groups!;
    args[key] = value;
  }

  const [lang] = raw.split(' ', 1);
  if (lang) args.lang = lang;

  return args;
};

const toHtml = (markdown: string, playground?: boolean) => {
  if (!markdown) return '';

  const md = new MarkdownIt({ highlight });
  const defaultFence = md.renderer.rules.fence;

  // Ajouter une règle pour gérer les liens vidéo
  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx];

    if (token.type === 'link_open') {
      const aIndex = token.attrIndex('href');
      if (aIndex >= 0 && token.attrs) {
        const href = token.attrs[aIndex][1];

        // Vérifier si le lien est un lien vidéo
        if (href && href.includes('?type=video')) {
          return `<video class="centered-video" src="${href.replace('?type=video', '')}" controls>`;
        }
      }
    }

    return self.renderToken(tokens, idx, options);
  };

  md.renderer.rules.link_close = (tokens, idx, options, env, self) => {
    const token = tokens[idx - 1];

    if (token.type === 'link_open') {
      const aIndex = token.attrIndex('href');
      if (aIndex >= 0 && token.attrs) {
        const href = token.attrs[aIndex][1];

        if (href && href.includes('?type=video')) {
          return `</video>`;
        }
      }
    }

    return self.renderToken(tokens, idx, options);
  };

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const { content, info } = tokens[idx];
    const args = parseArgs(info);

    if (playground && Object.keys(SANDBOX_TEMPLATES).includes(args.template)) {
      const el = document.createElement('div');

      Object.assign(el.dataset, {
        playground: true,
        code: content,
        template: args.template,
        autorun: args.autorun !== 'false',
      });

      return el.outerHTML;
    }

    return defaultFence?.(tokens, idx, options, env, self) || '';
  };

  return md.render(markdown);
};

type ReactRootElement = HTMLDivElement & { reactRoot?: Root };

export type MarkdownHtmlProps = {
  markdown: string;
  playground?: boolean;
};

export default memo(function MarkdownHtml(props: MarkdownHtmlProps) {
  const { markdown, playground } = props;
  const darkMode = useContext(DarkModeValueContext);

  const container = useRef<HTMLDivElement>(null);
  const playgrounds = useRef<Root[]>([]);
  const [html, setHtml] = useState('');

  useEffect(() => {
    setHtml(toHtml(markdown, playground));
  }, []);

  useEffect(() => {
    if (!container.current) return;

    container.current
      .querySelectorAll<HTMLDivElement>('[data-playground]')
      .forEach((el: ReactRootElement) => {
        if (!el.reactRoot) {
          el.reactRoot = createRoot(el);
          playgrounds.current.push(el.reactRoot);
        }

        el.reactRoot.render(
          <Playground {...(el.dataset as PlaygroundProps)} theme={darkMode ? 'dark' : 'light'} />,
        );
      });
  }, [html, darkMode]);

  useEffect(() => {
    return () => {
      playgrounds.current.forEach((root) => {
        setTimeout(() => root.unmount(), 0);
      });
    };
  }, []);

  return (
    <div className="Container">
      <Container
          ref={container}
          className="markdown-body"
          dangerouslySetInnerHTML={{ __html: html }}
        />
    </div>
  );
});
