<script lang="ts">
  import { goto } from "$app/navigation";
  import type { RemoteAlarm } from "$lib/types";
  import { page } from "$app/state";
    import { onMount } from "svelte";

  let list = $state<RemoteAlarm[]>([]);
  const device = page.url.searchParams.get("device");

  async function readAlarm() {
    const req = await fetch(`${import.meta.env.VITE_BACK_SERVER}/api/alarms?user_id=${device}`, {
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (req.ok) {
      const data = await req.json();
      list = data;
    }
  }

  onMount(() => {
    readAlarm();
  });
</script>

<svelte:head>
  <title>알람 목록</title>
</svelte:head>

<header class="flex justify-between text-xl p-2 border-gray-500 border-b">
  <span class="flex gap-2 items-center">
    <button aria-label="뒤로" onclick={() => goto("/")} class="p-2 flex items-center">
      <span class="material-symbols-outlined">
        arrow_back
      </span>
    </button>
    
    <span class="material-symbols-outlined">
      alarm
    </span>
    <span>알람</span>
  </span>
</header>

<main class="p-4 max-h-full overflow-hidden">
  <ul class="overflow-y-scroll h-56">
    {#each list as alarm}
      <li class="flex gap-2 shadow-md rounded-md p-4 items-center ok mb-2">
        <div class="time flex gap-2">
          <span class="text-2xl">{alarm.is_am ? "오전":"오후"}</span>
          <span class="text-3xl">{alarm.hour}:{alarm.minute < 10 ? `0${alarm.minute}` : alarm.minute}</span>
        </div>
        <div class="attributes">
          <span class="flex gap-2">
            <span class="material-symbols-outlined">
              music_note
            </span>
            {alarm.music_path !== "default" ? alarm.music_path.split("/")[3].split(".")[0] : alarm.music_path}
          </span>
          <span class="flex gap-2">
            <span class="material-symbols-outlined">
              repeat
            </span>
            {alarm.repeat_days === "" ? "안 함" : alarm.repeat_days}
          </span>
        </div>
      </li>
    {/each}
  </ul>
</main>

<style>
  .ok {
    border: 1px solid #5B9BBA;
  }
</style>