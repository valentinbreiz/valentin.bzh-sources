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
  const { t } = useTranslation();

  const createdAt = useMemo(() => format(new Date(article.createdAt), t('dateFormat')), [article]);

  useEffect(() => {
    const fetchViews = async () => {
      console.log(article)
      const viewCount = await getViewCount(article.number);
      setViews(viewCount);
    };

    fetchViews();
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
          {article.comments}
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
