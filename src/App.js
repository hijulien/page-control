import React, { useState, useRef, useEffect } from 'react';
import { Button } from 'antd';
import Peer from 'peerjs';
import './App.css';

const App = () => {

  console.log("组件执行");

  const [data, setData] = useState({
    peer: {},
    dataChan: null,
    mediaChan: null
  })

  const remote = useRef();

  const input = useRef();

  const tools = useRef();

  const toolsShow = () => {
    tools.current.style.height = "70px"
  }

  const mediaCall = () => {
    const createEmptyAudioTrack = () => {
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const dst = oscillator.connect(ctx.createMediaStreamDestination());
      oscillator.start();
      const track = dst.stream.getAudioTracks()[0];
      return Object.assign(track, { enabled: false });
    };

    const createEmptyVideoTrack = ({ width, height }) => {
      const canvas = Object.assign(document.createElement('canvas'), { width, height });
      canvas.getContext('2d').fillRect(0, 0, width, height);

      const stream = canvas.captureStream();
      const track = stream.getVideoTracks()[0];

      return Object.assign(track, { enabled: false });
    };

    const audioTrack = createEmptyAudioTrack();
    const videoTrack = createEmptyVideoTrack({ width: 640, height: 480 });
    const mediaStream = new MediaStream([audioTrack, videoTrack]);

    new Promise((resolve) => {
      resolve(mediaStream)
    }).then(localStream => {
      const mediaConn = data.peer.call(input.current.value, localStream);
      const dataConn = data.peer.connect(input.current.value);
      mediaConn.on("close", () => console.log("媒体连接被挂断"))
      dataConn.on('close', () => console.log("数据连接被挂断"))
      mediaConn.on('stream', (remoteStream) => {
        remote.current.srcObject = remoteStream;
      });
      setData({
        ...data,
        mediaChan: mediaConn,
        dataChan: dataConn
      })
    })
      .catch(err => {
        console.log(err);
      });
  }

  const hangUp = () => {
    console.log("挂断");
  }

  const clickEvent = (e) => {
    tools.current.style.height = 0;

    if (data.dataChan && data.mediaChan) {
      data.dataChan.send({
        type: "leftClick",
        X: (e.nativeEvent.offsetX / remote.current.offsetWidth).toFixed(5),
        Y: (e.nativeEvent.offsetY / remote.current.offsetHeight).toFixed(5)
      })
    }
  }

  const rightClick = (e) => {
    if (data.dataChan && data.mediaChan) {
      data.dataChan.send({
        type: "rightClick",
        X: (e.nativeEvent.offsetX / remote.current.offsetWidth).toFixed(5),
        Y: (e.nativeEvent.offsetY / remote.current.offsetHeight).toFixed(5)
      })
    }
    e.preventDefault()
  }

  const wheelEvent = (e) => {
    if (data.dataChan && data.mediaChan) {
      if (e.deltaY > 0 || e.datail > 0) {
        data.dataChan.send({
          type: "downWheel",
        })
      } else {
        data.dataChan.send({
          type: "upWheel",
        })
      }
    }
  }

  const mouseMove = (e) => {
    throttle(e)
  }

  const throttle = ((e) => {
    let last = 0
    return (e, wait = 100) => {
      let now = +new Date()
      if (data.dataChan && data.mediaChan && now - last > wait) {
        data.dataChan.send({
          type: "mouseMove",
          X: (e.nativeEvent.offsetX / remote.current.offsetWidth).toFixed(5),
          Y: (e.nativeEvent.offsetY / remote.current.offsetHeight).toFixed(5)
        })
        last = now
      }
    }
  })()

  var patt = /^[a-z]{1}$/i;

  // data.dataChan && data.mediaChan &&
  const keyUp = (e) => {

    if (data.dataChan && data.mediaChan) {
      switch (true) {
        //匹配字母
        case (patt.test(e.key)):
          data.dataChan.send({
            type: "key",
            value: e.key.toUpperCase(),
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey
          })
          break;

        //匹配数字
        case e.code.substring(0, 5) === "Digit":
          console.log("Num" + e.code.substr(e.code.length - 1, 1));
          data.dataChan.send({
            type: "key",
            value: "Num" + e.code.substr(e.code.length - 1, 1),
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey
          })
          break;

        case e.code.substring(0, 6) === "Numpad":
          data.dataChan.send({
            type: "key",
            value: "NumPad" + e.code.substr(e.code.length - 1, 1),
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey
          })
          break;

        //匹配方向键
        case e.key.substring(0, 5) === "Arrow":
          data.dataChan.send({
            type: "key",
            value: e.key.slice(5),
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey
          })
          break;

        case (e.code === "Minus" || e.code === "Equal" || e.code === "Backslash" || e.code === "Semicolon" || e.code === "Quote" || e.code === "Comma" || e.code === "Period" || e.key === "Slash" || e.code === "Space"):
          data.dataChan.send({
            type: "key",
            value: e.code,
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey
          })
          break;

        case e.code === "Backquote":
          data.dataChan.send({
            type: "key",
            value: "Grave",
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey
          })
          break;

        default:
          data.dataChan.send({
            type: "key",
            value: e.key,
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey
          })
          break;
      }
    }
    e.preventDefault();
  }

  const over = () => {
    document.addEventListener('keyup', keyUp)
  }

  const out = () => {
    document.removeEventListener('keyup', keyUp)
  }

  useEffect(() => {
    const peer = new Peer('', {
      host: '124.222.249.224',
      port: '9000',
      path: '/myapp'
    });

    peer.on('open', (id) => {
      console.log("opened");
      setData(data => {
        return {
          ...data,
          peer: peer
        }
      });
    });

    peer.on('connection', (conn) => {
      console.log("connectioned");
      conn.on('data', (msg) => {
        console.log(msg);
      });
    });

    peer.on('call', (call) => {
      console.log("called");
      navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "never"
        },
        audio: false
      })
        .then(localStream => {
          call.answer(localStream);
          call.on('stream', (remoteStream) => {
            remote.current.srcObject = remoteStream;
          });
        })
    });

    peer.on('close', () => console.log("on close"))

    peer.on("error", err => {
      console.log("on error", err.type);
    })
    return () => {
      document.removeEventListener('keyup', keyUp)
    }
  }, [])

  return (
    <div className='box'>
      <video
        height={"100%"}
        autoPlay
        playsInline
        ref={remote}
        onClick={clickEvent}
        onContextMenu={rightClick}
        onWheel={wheelEvent}
        onMouseMove={mouseMove}
        onMouseOver={over}
        onMouseOut={out}
      />

      <div className='tools-switch' onClick={toolsShow}></div>

      <div
        className={data.visiable ? 'tools tools-show' : 'tools tools-hide'}
        ref={tools}
      >
        <div className='tools-input'>
          <input
            type="text"
            placeholder="远程ID"
            ref={input}
          />
        </div>
        <div className='tools-items'>
          <Button ghost onClick={mediaCall}>连接</Button>

          <Button ghost onClick={hangUp}>断开</Button>
        </div>
      </div>
      <div className='sidebar'>
        <h3>local:{data.peer._id}</h3>
        <h3>remote:{data.dataChan?.peer}</h3>
      </div>
    </div>
  );
}

export default App;