import React from 'react';
import { BrowserRouter as Router, Outlet, Route, Routes } from 'react-router-dom';

import Article from './views/Article';
import Articles from './views/Articles';
import Home from './views/Home';
import Main from './views/Main';
import Projects from './views/Projects';

const milestones = {
  posts: Number(import.meta.env.VITE_GITHUB_MILESTONE_POSTS),
  snippets: Number(import.meta.env.VITE_GITHUB_MILESTONE_SNIPPETS),
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />}>
          <Route path="" element={<Home />} />
          <Route path="posts" element={<Outlet />}>
            <Route path="" element={<Articles milestone={milestones.posts} />} />
            <Route path=":id" element={<Article />} />
          </Route>
          <Route path="projects" element={<Projects />} />
        </Route>
      </Routes>
    </Router>
  );
}
