import React, { useState, useRef, useEffect } from 'react';
import { Button } from 'antd';
import Peer from 'peerjs';
import './App.css';

const App = () => {

  console.log("组件执行");

  const [data, setData] = useState({
    visiable: false,
    timer: false,
    peer: {},
    dataChan: null,
    mediaChan: null
  })

  const remote = useRef();

  const input = useRef();

  const toolsShow = () => {
    if (data.mediaChan != null) {
      setData({
        ...data,
        remoteId: data.dataChan?.peer,
        visiable: true,
        timer: false
      })
      setTimeout(() => {
        setData({
          ...data,
          remoteId: data.dataChan?.peer,
          visiable: true,
          timer: true
        })
      }, 500)
    } else {
      setData({
        ...data,
        visiable: true,
        timer: false
      })
      setTimeout(() => {
        setData({
          ...data,
          visiable: true,
          timer: true
        })
      }, 500)
    }
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
      mediaConn.on("close", () => console.log("媒体连接被挂断"))
      mediaConn.on('stream', (remoteStream) => {
        remote.current.srcObject = remoteStream;
      });
      setData({
        ...data,
        mediaChan: mediaConn
      })
    })
      .catch(err => {
        console.log(err);
      });
  }

  const dataCall = () => {
    const dataConn = data.peer.connect(input.current.value);
    setData({
      ...data,
      dataChan: dataConn
    });

    dataConn.on('close', () => console.log("数据连接被挂断"))
  }

  const hangUp = () => {
    console.log("挂断");
  }

  const clickEvent = (e) => {
    if (data.timer) {
      setData({
        ...data,
        remoteId: '',
        visiable: false,
        timer: false,
      })
    }
    if (data.dataChan != null) {
      data.dataChan.send([(e.nativeEvent.offsetX / remote.current.offsetWidth).toFixed(5), (e.nativeEvent.offsetY / remote.current.offsetHeight).toFixed(5)])
    }
  }

  window.onmousewheel = function (e) {
    if (e.wheelDelta > 0) {
      console.log('向上滑了', e.wheelDelta);
    } else {
      console.log('向下滑了', e.wheelDelta);
    }
  }

  useEffect(() => {
    const peer = new Peer('office', {
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
  }, [])

  return (
    <div className='box'>
      <video
        height={"100%"}
        autoPlay
        playsInline
        ref={remote}
        onClick={clickEvent}
      // onMouseMove={move}
      />

      {
        data.visiable
          ?
          ""
          :
          <div className='tools-switch' onClick={toolsShow}></div>
      }
      <div
        className={data.visiable ? 'tools tools-show' : 'tools tools-hide'}
      >
        <div className='tools-input'>
          <input
            type="text"
            placeholder="远程ID"
            ref={input}
          />
        </div>
        <div className='tools-items'>
          <Button ghost onClick={mediaCall}>媒体</Button>

          <Button ghost onClick={hangUp}>断开</Button>

          <Button ghost onClick={dataCall}>数据</Button>
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