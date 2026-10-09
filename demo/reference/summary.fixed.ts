export type Task = {
  id: string;
  title: string;
  status: "open" | "in_progress" | "done";
  archived?: boolean;
};

export type Summary = {
  total: number;
  open: number;
  inProgress: number;
  done: number;
};

/** archived omitted means active; only archived: true is excluded. */
export function summarize(tasks: readonly Task[]): Summary {
  const active = tasks.filter((task) => task.archived !== true);
  return {
    total: active.length,
    open: active.filter((task) => task.status === "open").length,
    inProgress: active.filter((task) => task.status === "in_progress").length,
    done: active.filter((task) => task.status === "done").length,
  };
}
