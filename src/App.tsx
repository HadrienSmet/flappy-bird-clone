import { MutableRefObject, useEffect, useRef } from "react";
import "./styles/index.scss";
import setupImg from "./assets/flappy-bird-set.png";

type PlayingHookType = {
    canvasRef: MutableRefObject<HTMLCanvasElement | null>;
    handleScore: () => void;
    handleLose: () => void;
};

const storedObj = JSON.parse(localStorage.getItem("flappy best") || "0");
const img = new Image();
img.src = setupImg;

let isPlaying = false;
const gravity = 0.5;
const speed = 6.2;
const size: [number, number] = [51, 36];
const jump = -11.5;

const pipeWidth = 78;
const pipeGap = 270;

let index = 0,
    bestScore: number = parseInt(storedObj),
    currentScore = 0,
    pipes: [number, number][] = [],
    flight: number,
    flyHeight: number;

const useFlappy = (canvasRef: MutableRefObject<HTMLCanvasElement | null>) => {
    const scoreRef = useRef<HTMLDivElement | null>(null);

    const pipeLoc = () =>
        Math.random() *
            (canvasRef.current!.height - (pipeGap + pipeWidth) - pipeWidth) +
        pipeWidth;

    const setup = () => {
        currentScore = 0;
        flight = jump;
        flyHeight = canvasRef.current!.height / 2 - size[1] / 2;
        pipes = Array.from({ length: 3 }, () => []).map((a, i) => [
            canvasRef.current!.width + i * (pipeGap + pipeWidth),
            pipeLoc(),
        ]);
    };
    const handleScore = () => {
        currentScore++;
        if (scoreRef.current) scoreRef.current.innerHTML = `${currentScore}`;
        bestScore = Math.max(bestScore, currentScore);
        pipes = [
            ...pipes.slice(1),
            [pipes[pipes.length - 1][0] + pipeGap + pipeWidth, pipeLoc()],
        ];
        pipes.push();
    };
    const handleLose = () => {
        isPlaying = false;
        localStorage.setItem("flappy best", `${bestScore}`);
        setup();
    };

    useEffect(() => {
        setup();

        document.addEventListener("click", () => (isPlaying = true));
        window.addEventListener("click", () => (flight = jump));

        return () => {
            document.removeEventListener("click", () => (isPlaying = true));
            window.removeEventListener("click", () => (flight = jump));
        };
    }, []);

    return {
        scoreRef,
        handleScore,
        handleLose,
    };
};

const useFlappyPlaying = ({
    canvasRef,
    handleScore,
    handleLose,
}: PlayingHookType) => {
    let ctx: CanvasRenderingContext2D | null;
    const drawFirstBackground = (ctx: CanvasRenderingContext2D | null) => {
        ctx?.drawImage(
            img,
            0,
            0,
            canvasRef.current!.width,
            canvasRef.current!.height,
            Math.floor(-(index * (speed / 2)) % canvasRef.current!.width) +
                canvasRef.current!.width,
            0,
            canvasRef.current!.width,
            canvasRef.current!.height
        );
    };
    const drawScdBackground = (ctx: CanvasRenderingContext2D | null) => {
        ctx?.drawImage(
            img,
            0,
            0,
            canvasRef.current!.width,
            canvasRef.current!.height,
            Math.floor(-(index * (speed / 2)) % canvasRef.current!.width),
            0,
            canvasRef.current!.width,
            canvasRef.current!.height
        );
    };
    const drawBirdPlaying = (
        ctx: CanvasRenderingContext2D | null,
        cTenth: number
    ) => {
        ctx?.drawImage(
            img,
            432,
            Math.floor((index % 9) / 3) * size[1],
            ...size,
            cTenth - size[0] / 2,
            flyHeight,
            ...size
        );
        flight += gravity;
        flyHeight = Math.min(
            flyHeight + flight,
            canvasRef.current!.height - size[1]
        );
    };
    const drawBirdUnplaying = (ctx: CanvasRenderingContext2D | null) => {
        ctx?.drawImage(
            img,
            432,
            Math.floor((index % 9) / 3) * size[1],
            ...size,
            canvasRef.current!.width / 2 - size[0] / 2,
            flyHeight,
            ...size
        );
        ctx?.fillText(`Meilleur score: ${bestScore}`, 55, 245);
        ctx?.fillText("Cliquez pour jouer", 48, 535);
        if (ctx) ctx.font = "bold 30px courier";
    };

    const drawTopPipe = (
        pipe: [number, number],
        ctx: CanvasRenderingContext2D | null
    ) => {
        ctx?.drawImage(
            img,
            432,
            588 - pipe[1],
            pipeWidth,
            pipe[1],
            pipe[0],
            0,
            pipeWidth,
            pipe[1]
        );
    };
    const drawBottomPipe = (
        pipe: [number, number],
        ctx: CanvasRenderingContext2D | null
    ) => {
        ctx?.drawImage(
            img,
            432 + pipeWidth,
            108,
            pipeWidth,
            canvasRef.current!.height - pipe[1] + pipeGap,
            pipe[0],
            pipe[1] + pipeGap,
            pipeWidth,
            canvasRef.current!.height - pipe[1] + pipeGap
        );
    };

    useEffect(() => {
        if (canvasRef.current) {
            const cTenth = canvasRef.current.width / 10;
            ctx = canvasRef.current.getContext("2d");
            flyHeight = canvasRef.current.height / 2 - size[1] / 2;
            if (ctx) {
                const render = () => {
                    index++;
                    drawFirstBackground(ctx);
                    drawScdBackground(ctx);
                    if (isPlaying) {
                        drawBirdPlaying(ctx, cTenth);
                    } else {
                        drawBirdUnplaying(ctx);
                    }

                    if (isPlaying) {
                        pipes.map((pipe) => {
                            pipe[0] -= speed;
                            drawTopPipe(pipe, ctx);
                            drawBottomPipe(pipe, ctx);
                            if (pipe[0] <= -pipeWidth) {
                                handleScore();
                            }
                            if (
                                [
                                    pipe[0] <= cTenth + size[0],
                                    pipe[0] + pipeWidth >= cTenth,
                                    pipe[1] >= flyHeight ||
                                        pipe[1] + pipeGap <=
                                            flyHeight + size[1],
                                ].every((element) => element)
                            ) {
                                handleLose();
                            }
                        });
                    }
                    window.requestAnimationFrame(render);
                };
                img.onload = render;
            }
        }
    }, [isPlaying]);
};

const App = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const { scoreRef, handleScore, handleLose } = useFlappy(canvasRef);
    useFlappyPlaying({ canvasRef, handleLose, handleScore });

    return (
        <div className="App">
            <header>
                <h1>Flappy the cloned bird</h1>
                <div className="score-container">
                    <div ref={scoreRef} id="score">
                        {currentScore}
                    </div>
                    <div id="bestscore">{bestScore}</div>
                </div>
            </header>
            <canvas
                ref={canvasRef}
                id="canvas"
                width={431}
                height={768}
            ></canvas>
        </div>
    );
};

export default App;
