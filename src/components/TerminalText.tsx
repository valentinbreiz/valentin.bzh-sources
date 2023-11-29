import React, { useState, useEffect } from 'react';
import tw from 'twin.macro';
import "../styles.css";

const Title = tw.h2`text-5xl text-slate-600 font-bold leading-10`;

const TerminalText = () => {
  const messages = ["valentinbreiz", "Full-Stack Engineer", ".NET Developer", "OS Developer", "Ethical Hacker", "Blogger", "Enthusiast"];
  const colors = ['rebeccapurple', 'lightblue'];
  const [messageIndex, setMessageIndex] = useState(0);
  const [colorIndex, setColorIndex] = useState(0);
  const [text, setText] = useState("");
  const [blink, setBlink] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    if (isDeleting) {
      if (text.length > 0) {
        timeoutId = setTimeout(() => {
          setText(prevText => prevText.slice(0, -1));
        }, 60);
      } else {
        setIsDeleting(false);
        setMessageIndex(prevIndex => (prevIndex + 1) % messages.length);
        setColorIndex(prevIndex => (prevIndex + 1) % colors.length);
      }
    } else {
      if (text.length < messages[messageIndex].length) {
        timeoutId = setTimeout(() => {
          setText(messages[messageIndex].substr(0, text.length + 1));
        }, 80);
      } else {
        // Pause une fois le texte entièrement écrit
        timeoutId = setTimeout(() => {
          setIsDeleting(true);
        }, 400); // Durée uniforme de la pause pour tous les textes
      }
    }

    return () => clearTimeout(timeoutId);
  }, [text, messageIndex, isDeleting, messages]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setBlink(b => !b);
    }, 400);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="console-container">
      <Title style={{ color: colors[colorIndex] }}>
        👋 hi! I'm {text}
        <span className={`console-underscore ${blink ? '' : 'hidden'}`}>&#95;</span>
      </Title>
    </div>
  );
};

export default TerminalText;
