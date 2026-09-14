import { createPostItAction, deletePostItAction } from "@/app/actions/post-its";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { listPostIts } from "@/lib/post-its";

export function PostItTray({
  postIts,
}: {
  postIts: Awaited<ReturnType<typeof listPostIts>>;
}) {
  return (
    <div className="flex flex-col gap-2 rounded border p-3">
      <h2 className="text-xs font-medium text-zinc-500">
        📌 POST-ITS — drag one onto a day to schedule it
      </h2>

      <div className="flex flex-wrap gap-3">
        {postIts.length === 0 && (
          <p className="text-sm text-zinc-500">
            No post-its yet — jot one below, or promote a quick-list item.
          </p>
        )}
        {postIts.map((postIt) => (
          <PostItCard key={postIt.id} id={postIt.id} text={postIt.text} />
        ))}
      </div>

      <form action={createPostItAction} className="flex max-w-sm gap-2">
        <Input name="text" placeholder="Jot a quick note" required />
        <Button type="submit" size="sm">
          Add
        </Button>
      </form>
    </div>
  );
}

function PostItCard({ id, text }: { id: string; text: string }) {
  return (
    <div className="relative w-36 -rotate-1 rounded bg-yellow-100 p-2 pt-3 text-sm shadow odd:rotate-1">
      <form action={deletePostItAction.bind(null, id)} className="absolute top-0.5 right-1">
        <button
          type="submit"
          aria-label="Dismiss post-it"
          className="text-xs text-zinc-500 hover:text-zinc-800"
        >
          ✕
        </button>
      </form>
      <p className="break-words pr-2">{text}</p>
    </div>
  );
}
