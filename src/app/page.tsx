"use client";

import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [targetNumber, setTargetNumber] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState("Guess a number between 1 and 100");
  const [gameStatus, setGameStatus] = useState<"playing" | "won">("playing");
  const [guesses, setGuesses] = useState<
    { player: number; guess: number; feedback: string }[]
  >([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize game
  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    setTargetNumber(Math.floor(Math.random() * 100) + 1);
    setCurrentPlayer(1);
    setGuess("");
    setFeedback("Guess a number between 1 and 100");
    setGameStatus("playing");
    setGuesses([]);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleGuess = (e: React.FormEvent) => {
    e.preventDefault();

    if (gameStatus !== "playing") return;

    const guessNum = parseInt(guess, 10);

    if (isNaN(guessNum) || guessNum < 1 || guessNum > 100) {
      setFeedback("Please enter a valid number between 1 and 100.");
      return;
    }

    let currentFeedback = "";

    if (guessNum === targetNumber) {
      currentFeedback = "🎉 Correct! You win! 🎉";
      setFeedback(currentFeedback);
      setGameStatus("won");
    } else if (guessNum < targetNumber) {
      currentFeedback = "Too low! ⬆️";
      setFeedback(currentFeedback);
      setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
    } else {
      currentFeedback = "Too high! ⬇️";
      setFeedback(currentFeedback);
      setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
    }

    setGuesses((prev) => [
      ...prev,
      { player: currentPlayer, guess: guessNum, feedback: currentFeedback },
    ]);
    setGuess("");
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <main className="min-h-screen bg-gradient-animated flex items-center justify-center p-4">
      <div className="glass rounded-3xl p-8 w-full max-w-md shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2 tracking-tight">
            Number Game
          </h1>
          <p className="text-blue-200/80 text-sm">
            Two players take turns guessing a number between 1 and 100.
          </p>
        </div>

        {gameStatus === "playing" ? (
          <div className="space-y-6">
            <div className="flex justify-center items-center space-x-4 mb-4">
              <div
                className={`px-4 py-2 rounded-full font-bold transition-colors ${
                  currentPlayer === 1
                    ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30"
                    : "bg-white/10 text-white/50"
                }`}
              >
                Player 1
              </div>
              <div
                className={`px-4 py-2 rounded-full font-bold transition-colors ${
                  currentPlayer === 2
                    ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30"
                    : "bg-white/10 text-white/50"
                }`}
              >
                Player 2
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center min-h-[5rem] flex items-center justify-center">
              <p
                className={`text-lg font-medium transition-colors ${
                  feedback.includes("win")
                    ? "text-green-400 font-bold text-2xl"
                    : feedback.includes("valid")
                    ? "text-red-400"
                    : "text-white"
                }`}
              >
                {feedback}
              </p>
            </div>

            <form onSubmit={handleGuess} className="space-y-4">
              <input
                ref={inputRef}
                type="number"
                min="1"
                max="100"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                placeholder="Enter your guess..."
                className="w-full bg-black/20 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all text-center text-xl font-bold"
                autoFocus
                disabled={gameStatus !== "playing"}
              />
              <button
                type="submit"
                disabled={!guess || gameStatus !== "playing"}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Submit Guess
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center space-y-6 animate-fade-in-up">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Player {currentPlayer} Wins!
            </h2>
            <p className="text-green-400 text-xl font-medium mb-6">
              The number was {targetNumber}
            </p>
            <button
              onClick={startNewGame}
              className="w-full bg-gradient-to-r from-emerald-400 to-green-600 hover:from-emerald-300 hover:to-green-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-1 active:translate-y-0"
            >
              Play Again
            </button>
          </div>
        )}

        {/* Guess History */}
        {guesses.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">
              History
            </h3>
            <div className="max-h-40 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              {[...guesses].reverse().map((g, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm bg-black/20 rounded-lg py-2 px-3 border border-white/5"
                >
                  <span
                    className={`font-bold ${
                      g.player === 1 ? "text-cyan-400" : "text-purple-400"
                    }`}
                  >
                    P{g.player}
                  </span>
                  <span className="text-white font-mono">{g.guess}</span>
                  <span className="text-white/70 text-xs">{g.feedback}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
