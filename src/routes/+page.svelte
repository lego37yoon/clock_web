<script lang="ts">
    import type { Task, RemoteAlarm } from "$lib/types";

  let device = $state<string|undefined>(undefined);
  let timezone = $state("Asia/Seoul");
  let time = $state("00:00");
  let ampm = $state("오전");
  let date = $state("1970년 1월 1일 월요일");
  let temperature = $state(0);
  let humidity = $state(0);

  let focusMode = $state(false);
  let tasks = $state<Task[]>([]);
  let taskIndex = $state(0);

  let detacted = $state(false);
  let detactTimeout = $state<number|undefined>(undefined);
  let sleepMode = $state(false);
  let sleepModeTimeout = $state<number|undefined>(undefined);

  let alarmList = $state<RemoteAlarm[]>();
  let alarmSrc = $state<string>();
  let alarmTimeout = $state<number>();

  function updateTime() {
    const now = new Date();
    let hour = now.getHours();
    const minute = now.getMinutes().toString().padStart(2, '0');
    const ampmCalc = hour >= 12 ? '오후' : '오전';
    hour = hour % 12 || 12;
    
    time = `${hour}:${minute}`;
    ampm = ampmCalc;
    const formattedDate = now.toLocaleDateString('ko-KR', { 
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' 
    });
    date = formattedDate;
    
    const day = new Intl.DateTimeFormat("ko-KR", { weekday: "short" }).format(now);

    if (alarmList && alarmList.length > 0) {
      alarmList.forEach((alarm) => {
        if (alarm.hour === hour && 
          alarm.minute === Number(minute) &&
          alarm.repeat_days.includes(day)
        ) {
          if ((alarm.is_am && ampmCalc === "오전") || !alarm.is_am && ampmCalc === "오후") {
            if (!alarmTimeout) {
              alarmSrc = alarm.music_path;
              alarmTimeout = setTimeout(() => {
                alarmSrc = undefined;
              }, 60000);
            }  
          }
        }
      });
    }
  }

  setInterval(() => {
    updateTime();
  }, 1000);

  setInterval(() => {
    readEvents();
    readSettings();
    readAlarm();
  }, 1500);

  const socket = new WebSocket(`${import.meta.env.VITE_SOCKET_SERVER}`);

  socket.addEventListener("message", function (event) {
    const data = JSON.parse(event.data);

    if (data.type) {
      if (data.type === "dht_sensor") {
        temperature = data.temperature;
        humidity = data.humidity;
      } else if (data.type === "person_detection" && data.message === "Person Detected") {
        if (!sleepMode) {
          detacted = true;
          if (detactTimeout) {
            clearTimeout(detactTimeout);
            detactTimeout = setTimeout(() => { detacted = false }, 5000);
          } else {
            detactTimeout = setTimeout(() => { detacted = false }, 5000);
          }
        }
      }
    }
  });

  async function readEvents() {
    const req = await fetch(`${import.meta.env.VITE_BACK_SERVER}/api/tasks/today`, {
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (req.ok) {
      const data = await req.json();
      tasks = data;
    }
  }

  async function readSettings() {
    const req = await fetch(`${import.meta.env.VITE_BACK_SERVER}/settings`, {
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (req.ok) {
      const data : [] = await req.json();

      data.forEach((item : { key: string, value: string }) => {
        if (item.key === "device")
          device = item.value;
        else if (item.key === "timezone")
          timezone = item.value;
      });
    }
  }

  async function readAlarm() {
    const req = await fetch(`${import.meta.env.VITE_BACK_SERVER}/api/alarms?user_id=${device}`, {
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (req.ok) {
      const data = await req.json();
      alarmList = data;
    }
  }
</script>

<svelte:head>
  <title>시계</title>
</svelte:head>

<main>
  <header>
    <span class="flex items-center gap-1">
      {#if device}
      <span class="material-symbols-outlined">
        smartphone
      </span>
      {device}
      {:else}
      <span class="material-symbols-outlined warn">
        security_update_warning
      </span>
      <span>연결되지 않음</span>
      {/if}
    </span>
  </header>
  <section id="dateTime">
    <div id="tempAndDate" class="shrink-0 min-w-28">
        <section class="date text-end p-1">
          <span class="block text-xl">
            {date.split(" ")[0]}
          </span>
          <span class="block text-2xl">
            {`${date.split(" ")[1]} ${date.split(" ")[2]}`}
          </span>
          <span class="block text-xl">
            {date.split(" ")[3]}
          </span>
        </section>
        <section class="envir text-2xl p-1">
          <p class="flex justify-between items-center">
            <span class="material-symbols-outlined warn">
              device_thermostat
            </span>
            <span class="flex items-baseline gap-2">
              {temperature}
              <span class="text-base w-4">
                °C
              </span>
            </span>
          </p>
          <p class="flex justify-between items-center">
            <span class="material-symbols-outlined ok">
              humidity_low
            </span>
            <span class="flex items-baseline gap-2">
              {humidity}
              <span class="text-base w-4">
                %
              </span>
            </span>
          </p>
        </section>
    </div>
    <button id="time" class={`items-end flex gap-1 justify-end w-full leading-[0.8] font-bold mb-2 ${alarmSrc ? "alarm" : ""}`} onclick={() => {
      if (alarmSrc) {
        alarmSrc = undefined;
      }
    }}>
      <span class="text-2xl">{ampm}</span>
      <span class="text-[6rem]">{time}</span>
    </button>
  </section>
  {#if focusMode}
  <section id="focusMode">
    <div class={`p-2 shadow-sm rounded-md w-full flex justify-between bg-white ${detacted || sleepMode ? '' : "warn"}`}>
      <span>
        {detacted && !sleepMode ? "집중 중입니다." : sleepMode ? "휴식 중입니다" : "현재 집중 중이지 않습니다."}
      </span>
      <button onclick={() => { 
        if (sleepMode) {
          sleepMode = false;
          clearTimeout(sleepModeTimeout);
        } else {
          sleepMode = true;
          sleepModeTimeout = setTimeout(() => { sleepMode = false }, 600000); 
      }}} class="flex bg-gray-50 items-center">
        <span class="material-symbols-outlined">
          airline_seat_recline_extra
        </span>
        10분 휴식
      </button>
    </div>
  </section>
  {:else}
  <section id="tasks">
    <button aria-label="prev item" class="flex items-center"
      onclick={() => taskIndex !== 0 ? taskIndex -= 1 : ''}
      disabled={taskIndex === 0}>
      <span class="material-symbols-outlined">
        arrow_back
      </span>
    </button>
    <div class="bg-white shadow-sm rounded-md p-2 w-full text-[#989898] flex items-center justify-between">
      {tasks.length > 0 ? tasks[taskIndex].title : "남은 일정을 표시하려면 앱으로 동기화하세요"}
    </div>
    <button aria-label="next item" class="flex items-center"
      onclick={() => tasks.length === taskIndex + 1 ?  '' : taskIndex += 1}
      disabled={tasks.length === taskIndex + 1}>
      <span class="material-symbols-outlined">
        arrow_forward
      </span>
    </button>
  </section>
  {/if}
  <footer>
    <button onclick={() => focusMode = !focusMode} class={focusMode ? "warn" : ""}>
      <span class="material-symbols-outlined">
        target
      </span>
      집중 모드
    </button>
    <a href={`/alarm?device=${device}`}>
      <span class="material-symbols-outlined">
        alarm
      </span>
      알람
    </a>
  </footer>
  {#if alarmSrc}
  <audio src={`${import.meta.env.VITE_BACK_SERVER}${alarmSrc}`} autoplay></audio>
  {/if}
</main>

<style>
  main {
    background-image: url("/bg.jpeg");
    background-repeat: no-repeat;
    background-size: cover;
  }
  
  header {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0.5rem 0.5rem 0 0.5rem;
  }

  footer {
    display: flex;
    justify-content: space-between;
  }

  footer button, footer a {
    border-radius: 5px;
    background: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    color: #6A6A6A;
    padding: 0.5rem;
    margin: 0.5rem;
    cursor: pointer;
    flex-grow: 1;
  }

  button[disabled] {
    color: #9a9a9a
  }

  .warn {
    color: #E28761;
  }

  .ok {
    color: #5B9BBA;
  }
  
  .alarm {
    animation-duration: 1s;
    animation-name: blink;
    animation-iteration-count: infinite;
  }

  #tasks, #focusMode {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.5rem;
  }

  #dateTime, .date {
    border-bottom: 2px solid gray;
  }

  #dateTime {
    display: flex;
    padding: 0 0.5rem;
    gap: 0.5rem;
  }

  #dateTime, header, footer, #tasks, #focusMode {
    background: #ffffffaa;
  }

  @keyframes blink {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
</style>