import { format } from 'date-fns';
import React, { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import tw from 'twin.macro';
import IconComments from '~icons/ri/chat-2-line';
import IconViews from '~icons/ri/eye-line';
import LabelItem from '../components/LabelItem';
import MarkdownHtml from '../components/MarkdownHtml';
import Pagination from '../components/Pagination';
import Skeleton from '../components/Skeleton';
import useHandling from '../hooks/use-handling';
import useQuery from '../hooks/use-query';
import ArticleModel from '../models/ArticleModel';
import CommentModel from '../models/CommentModel';
import github from '../services/github';
import { createQueryURL } from '../utils';
import useFirebase from '../hooks/use-firebase';
import { DarkModeValueContext } from '../hooks/use-dark-mode';

const Wrapper = tw.article`mx-auto w-full max-w-screen-lg px-8 py-12`;

const Title = tw.h2`text-2xl text-slate-700`;

const Into = tw.div`mt-4 mb-8 space-x-4 flex flex-wrap content-center text-sm text-slate-400`;

const ParagraphSkeleton = tw.ul`mt-8 space-y-4`;

function useArticle() {
  const { id } = useParams();
  const [article, setArticle] = useState<ArticleModel>();

  const [loading, load] = useHandling(
    useCallback(async () => {
      const result = await github.getIssue(parseInt(id!, 10));
      setArticle(ArticleModel.from(result));
    }, [id]),
    true,
  );

  useEffect(() => {
    load();
  }, [id]);

  return [loading, article] as const;
}

export default memo(function Article() {
  const { increaseViewCount, getViewCount } = useFirebase();
  const { t } = useTranslation();
  const [articleLoading, article] = useArticle();
  const { id } = useParams();
  const [views, setViews] = useState(0);
  const [comments, setComments] = useState(0);
  const [hasCountedView, setHasCountedView] = useState(false);
  const darkMode = useContext(DarkModeValueContext);

  const createdAt = useMemo(() => {
    return article ? format(new Date(article.createdAt), t('dateFormat')) : '';
  }, [article]);

  const getLabelLink = useCallback((label: string) => {
    return `../${createQueryURL({ label, page: 1 })}`;
  }, []);

  const loadArticleAndViewCount = useCallback(async () => {
    if (!hasCountedView) {
      const currentViews = await getViewCount(parseInt(id!, 10));
      setViews(currentViews + 1);
      await increaseViewCount(parseInt(id!, 10));
      setHasCountedView(true);
    }
  }, [id, increaseViewCount, getViewCount, hasCountedView]);

  useEffect(() => {
    if (!hasCountedView) {
      loadArticleAndViewCount();
    }
  }, [id]);

  const utterancesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const originalTitle = document.title;
    if (article && article.title) {
      document.title = article.title;

      const container = utterancesContainerRef.current;
      if (!container) return;
  
      // Supprimer le script existant
      while (container.firstChild) {
        container.firstChild.remove();
      }
  
      // Créer un nouveau script
      const script = document.createElement('script');
      script.src = 'https://giscus.app/client.js';
      script.async = true;
      script.setAttribute('data-repo', 'valentinbreiz/valentin.bzh');
      script.setAttribute('data-repo-id', 'R_kgDOKzdwWQ');
      script.setAttribute('data-category', 'Blog Posts');
      script.setAttribute('data-category-id', 'DIC_kwDOKzdwWc4CbW-b');
      script.setAttribute('data-mapping', 'title');
      script.setAttribute('data-strict', '1');
      script.setAttribute('data-reactions-enabled', '1');
      script.setAttribute('data-emit-metadata', '1');
      script.setAttribute('data-input-position', 'bottom');
      script.setAttribute('data-theme', darkMode ? 'dark' : 'light');
      script.setAttribute('crossorigin', 'anonymous');
  
      // Ajouter le nouveau script au conteneur
      container.appendChild(script);
    }
    return () => {
      document.title = originalTitle;
    };
  }, [article, darkMode]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== 'https://giscus.app') return;
      if (!(typeof event.data === 'object' && event.data.giscus)) return;
    
      const giscusData = event.data.giscus;
      
      if (giscusData && 'discussion' in giscusData) {
        setComments(giscusData.discussion.totalCommentCount);
      }
    }
    
    window.addEventListener('message', handleMessage);
  })

  return (
    <Wrapper>
      <article>
        {articleLoading && (
          <>
            <Skeleton tw="h-8 w-1/3" />
            <ParagraphSkeleton>
              <Skeleton tw="w-1/2" />
              <Skeleton tw="w-full" />
              <Skeleton tw="w-4/5" />
              <Skeleton tw="w-full" />
              <Skeleton tw="w-3/5" />
              <Skeleton tw="w-full h-40" />
              <Skeleton tw="w-4/5" />
              <Skeleton tw="w-full" />
              <Skeleton tw="w-3/5" />
              <Skeleton tw="w-full" />
              <Skeleton tw="w-2/5" />
            </ParagraphSkeleton>
          </>
        )}

        {article && (
          <>
            <Title>{article.title}</Title>
            <Into>
              <span>{createdAt}</span>
              <span tw="flex items-center">
                {article.labels.map((label) => (
                  <LabelItem key={label.id} label={label} getLink={getLabelLink} />
                ))}
              </span>
              <span tw="flex items-center">
                <IconViews />
                <span tw="ml-1">{views}</span>
              </span>
              <span tw="flex items-center">
                <IconComments />
                <span tw="ml-1">{comments}</span>
              </span>
            </Into>
            <MarkdownHtml markdown={article.body} playground />
          </>
        )}
      </article>
      <section tw="mt-8">
        <div ref={utterancesContainerRef}></div>
      </section>
    </Wrapper>
  );
});
