import { format } from 'date-fns';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, To } from 'react-router-dom';
import tw from 'twin.macro';
import IconComments from '~icons/ri/chat-2-line';
import IconViews from '~icons/ri/eye-line';

import ArticleModel from '../models/ArticleModel';
import LabelItem from './LabelItem';
import useFirebase from '../hooks/use-firebase';

const Wrapper = tw.div`flex flex-col justify-center h-20 border-t  border-dotted border-gray-300 dark:border-gray-800`;

const Row = tw.div`flex items-center`;

const Left = tw.div`hidden lg:block w-36 text-sm text-slate-400 dark:text-slate-600 text-right`;

const Right = tw.div`ml-4 flex-1 min-w-0 truncate`;

export type ArticleItemProps = {
  article: ArticleModel;
  getLink: (id: number) => To;
  getLabelLink: (label: string) => To;
};

export default function ArticleItem(props: ArticleItemProps) {
  const { getViewCount } = useFirebase();
  const { article, getLink, getLabelLink } = props;
  const [views, setViews] = useState(0);
  const [comments, setComments] = useState(0);
  const { t } = useTranslation();

  const createdAt = useMemo(() => format(new Date(article.createdAt), t('dateFormat')), [article]);

  const fetchCommentsCount = async (articleTitle: string) => {
    const repoOwner = 'valentinbreiz';
    const repoName = 'valentin.bzh';
    const token = import.meta.env.VITE_GITHUB_ACCESS_TOKEN_PART1 + import.meta.env.VITE_GITHUB_ACCESS_TOKEN_PART2;

    const query = `
      query {
        repository(owner: "${repoOwner}", name: "${repoName}") {
          discussions(first: 100) {
            nodes {
              title
              comments {
                totalCount
              }
            }
          }
        }
      }
    `;
  
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });
  
    const data = await response.json();

    const matchingDiscussion = data.data.repository.discussions.nodes.find(discussion => discussion.title === articleTitle);
  
    if (matchingDiscussion) {
      const commentsCount = matchingDiscussion.comments.totalCount;
      return commentsCount;
    } else {
      console.log('No discussion found with this name.');
      return 0;
    }
  };

  useEffect(() => {
    const fetchViews = async () => {
      const viewCount = await getViewCount(article.number);
      setViews(viewCount);
    };

    const fetchComments = async () => {
      if (article && article.title) {
        fetchCommentsCount(article.title).then(commentsCount => {
          setComments(commentsCount);
        });
      }
    };

    fetchViews();
    fetchComments();
  }, [article.id, getViewCount]);

  return (
    <Wrapper>
      <Row>
        <Left>{createdAt}</Left>
        <Right>
          <Link to={getLink(article.number)}>{article.title}</Link>
        </Right>
      </Row>
      <Row tw="mt-1">
        <Left>
          <IconViews tw="inline mr-2" />
          {views} 
          <IconComments tw="inline ml-4 mr-2" />
          {comments}
        </Left>
        <Right tw="flex text-sm text-slate-400">
          {article.labels.map((label) => (
            <LabelItem key={label.id} label={label} getLink={getLabelLink} />
          ))}
        </Right>
      </Row>
    </Wrapper>
  );
}
