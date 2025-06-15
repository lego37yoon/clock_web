export type Task = { 
  title: string, end_time: string, id: number, is_completed: boolean, start_time: string, user_id: string 
}

export type RemoteAlarm = {
  minute: number,
  id: number,
  repeat_days: string,
  puzzle_mode: boolean,
  is_am: boolean,
  user_id: string,
  hour: number,
  music_path: string,
  created_at: string
}
