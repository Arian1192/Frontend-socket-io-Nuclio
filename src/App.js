import { useEffect, useState } from 'react';
import { useForm } from "react-hook-form";
import ReactHowler from 'react-howler';
import sonido from './sonidos/zumbidoespecial.ogg'
import './App.css';
import imagenOpenAI from './assetts/OpenAI.svg'
const io = require('socket.io-client');
const socket = io('http://localhost:3001', {
    reconnection: false
});

function App() {
    const [messages, setMessages] = useState([]);
    const [incomingMessage, setIncomingMessage] = useState({});
    const [showIncomingMessage, setShowIncomingMessage] = useState(false);
    const [room, setRoom] = useState('');
    const [zumbido, setZumbido] = useState(false);
    const [viewRooms, setViewRooms] = useState(false);
    const { register, handleSubmit, reset } = useForm();


    useEffect(() => {
        const receiveMessage = (message) => {
            setRoom(message.room)
            setMessages([...messages, { body: message.body, from: 'THEM' }]);
            setIncomingMessage(message);
            setShowIncomingMessage(true);
            setTimeout(() => {
                setShowIncomingMessage(false);
            }, 3000);
        }
        socket.on('reply', receiveMessage);
        return () => {
            socket.off('reply', receiveMessage);
        }
    }, [messages, incomingMessage]);


    useEffect(() => {
        const replyFromOpenAi = (message) => {
            setRoom(message.room)
            setMessages([...messages, { body: message.body, from: 'OpenAI' }]);
            setIncomingMessage(message);
            setShowIncomingMessage(true);
            setTimeout(() => {
                setShowIncomingMessage(false);
            }, 3000);
        }
        socket.on('replyFromOpenAi', replyFromOpenAi);
        return () => {
            socket.off('replyFromOpenAi', replyFromOpenAi);
        }
    }, [messages, incomingMessage])

    socket.on('buzzer', () => {
        setZumbido(true);
        setTimeout(() => {
            setZumbido(false);
        }, 2000);
    });

    useEffect(() => {
        const onMessageWelcome = (message) => {
            setRoom(message.room);
            setIncomingMessage(message);
            setShowIncomingMessage(true);
            setTimeout(() => {
                setShowIncomingMessage(false);
            }, 5000);
        }
        socket.on('messageWelcome', onMessageWelcome);
        return () => {
            socket.off('messageWelcome', onMessageWelcome);
        }
    }, [incomingMessage, room]);

    const changeRoom = (e) => {
        e.preventDefault();
        console.log(e.target.value);
        socket.emit('joinRoom', e.target.value);
        setRoom(e.target.value);
        setMessages([]);
        setViewRooms(false);
    }

    const onSubmit = (data) => {
        if (data.message.includes('/ai') && data.message.split(' ').length > 1) {
            const text = data.message.split(' ').slice(1).join(' ');
            socket.emit('peticion_httpOpenAi', { message: text, room: room })
            const newMessage = { body: data.message, from: 'ME to Openai' };
            setMessages([...messages, newMessage,]);
            reset();
        } else {
            socket.emit('chat', { message: data.message, room: room });
            const newMessage = { body: data.message, from: 'ME' };
            setMessages([...messages, newMessage,]);
            reset();
        }


    }

    const onBuzzer = () => {
        socket.emit('buzzer', 'zumbido');
    }

    const openRooms = () => {
        setViewRooms(!viewRooms);
    }

    const scrollIntoView = (el) => {
        if (el) {
            el.scrollIntoView({ behavior: "smooth" });
        }
    }

    return (
        <div className="flex flex-row items-center h-screen p-3 max-lg:flex-col min-w-2xl justify-evenly bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
            {showIncomingMessage && (
                <div className='fixed bottom-0 right-0 p-4 m-4 bg-green-500 rounded shadow-xl animate-slideInDown'>
                    <p className='text-white'>{incomingMessage.from}: {incomingMessage.body}</p>

                </div>
            )}
            <div className='flex flex-col items-center justify-center w-64 m-10 font-bold text-white'>
                <img src={imagenOpenAI} alt="OpenAI" className='z-10 w-64 -m-8' />
                <h2 className='text-lg text-white'> If You want to use OpenAi type on the input "/ai" + your query to see the magic <span className='text-2xl'>🪄</span>   </h2>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className={`flex flex-col max-w-2xl  gap-5 p-10 shadow-xl mb-50 bg-neutral-800 rounded-xl  transition delay-300 ease-linear hover:shadow-black hover:shadow-2xl ${zumbido ? 'animate-wave' : null}`}>
                {room && (<span className='text-white'>{room === 'waitingRoom' ? 'Waiting Room' : room}</span>)}
                <ul className='h-64 overflow-y-auto flex-grow-1 scrollbar-hide'>
                    {messages.map((message, index) => (
                        <li key={index} ref={scrollIntoView}
                            className={`max-w-32 p-2 m-2 rounded table  text-sm whitespace-wrap break-all ${message.from === "ME" ? 'bg-cyan-300 text-teal-900' : message.from === 'ME to Openai' ? 'bg-orange-400 ml-auto text-black' : message.from === 'OpenAI' ? 'bg-pink-400 ml-auto text-black' : message.from === 'THEM' ? 'bg-teal-300 ml-auto text-black': null} `}
                        >{message.from}: {message.body}</li>
                    ))}
                </ul>
                <div className='flex'>
                    <div className='flex flex-col h-8'>
                        <input {...register('message', { required: true, minLength: 1 })} className='p-2 rounded shadow-md bg-zinc-600 text-zinc-300 shadow-neutral-800 hover:shadow-xl' />
                    </div>
                    <div className='flex flex-row '>
                        <button type="submit" className='px-2 py-2 ml-4 font-bold text-white transition bg-orange-500 rounded shadow-md hover:bg-green-300 hover:shadow-xl hover:text-zinc-700'>Send</button>
                        <button className='px-2 py-2 ml-4 font-bold text-white transition bg-yellow-500 rounded shadow-md cursor-pointer hover:bg-red-700 hover:shadow-xl hover:text-black' onClick={onBuzzer}>Buzzer</button>
                        <button className='px-2 py-2 ml-4 font-bold text-white transition bg-yellow-500 rounded shadow-md cursor-pointer hover:bg-red-700 hover:shadow-xl hover:text-black' onClick={openRooms}>{viewRooms ? 'Cerrar Rooms' : 'Abrir Rooms'}</button>
                    </div>
                </div>
                {viewRooms && (
                    <div className='flex flex-col gap-2 '>
                        <button className='px-2 py-2 font-bold text-white transition bg-teal-400 rounded shadow-md hover:bg-green-300 hover:shadow-xl hover:text-zinc-700' value='room1' onClick={changeRoom}>Room 1</button>
                        <button className='px-2 py-2 font-bold text-white transition bg-teal-400 rounded shadow-md hover:bg-green-300 hover:shadow-xl hover:text-zinc-700' value='room2' onClick={changeRoom}>Room 2</button>
                        <button className='px-2 py-2 font-bold text-white transition bg-teal-400 rounded shadow-md hover:bg-green-300 hover:shadow-xl hover:text-zinc-700' value='room3' onClick={changeRoom}>Room 3</button>
                    </div>
                )}
            </form>
            {zumbido && (
                <ReactHowler
                    src={sonido}
                    playing={true}
                    loop={false}
                    volume={0.5}
                />
            )}
        </div>
    );
}

export default App;
