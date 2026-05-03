import { useState } from "react";
import { useDragStore } from "@/store/drag";
import { useItemActions } from "@/hooks/useItemActions";

interface Props {
  accept: (source: {
    itemHash: number;
    bucketHash: number;
    naturalSlotHash?: number;
    ownerCharacterId: string | null;
  }) => boolean;
  onDrop: (
    actions: ReturnType<typeof useItemActions>,
    source: {
      itemInstanceId: string;
      itemHash: number;
      ownerCharacterId: string | null;
      naturalSlotHash?: number;
    }
  ) => void | Promise<void>;
  className?: string;
  children: React.ReactNode;
}

export function DropZone({ accept, onDrop, className = "", children }: Props) {
  const dragging = useDragStore((s) => s.dragging);
  const actions = useItemActions();
  const [isOver, setIsOver] = useState(false);

  // Compute acceptance lazily so we're resilient to React state timing:
  // at first dragOver, zustand state may not yet reflect dragStart from
  // the same tick. We still preventDefault so the browser marks us as a
  // drop target, then validate for real in onDrop.
  const canAccept =
    !!dragging &&
    accept({
      itemHash: dragging.item.itemHash,
      bucketHash: dragging.item.bucketHash,
      naturalSlotHash: dragging.naturalSlotHash,
      ownerCharacterId: dragging.ownerCharacterId,
    });

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = canAccept ? "move" : "none";
        if (canAccept) setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        // Read latest dragging from store at drop time — state is guaranteed settled here
        const drag = useDragStore.getState().dragging;
        if (!drag?.item.itemInstanceId) return;
        if (
          !accept({
            itemHash: drag.item.itemHash,
            bucketHash: drag.item.bucketHash,
            naturalSlotHash: drag.naturalSlotHash,
            ownerCharacterId: drag.ownerCharacterId,
          })
        )
          return;
        onDrop(actions, {
          itemInstanceId: drag.item.itemInstanceId,
          itemHash: drag.item.itemHash,
          ownerCharacterId: drag.ownerCharacterId,
          naturalSlotHash: drag.naturalSlotHash,
        });
      }}
      className={`${className} ${
        canAccept ? "ring-2 ring-bungie-accent/40" : ""
      } ${isOver ? "ring-2 ring-bungie-accent bg-bungie-accent/10 scale-[1.02]" : ""} transition-all`}
    >
      {children}
    </div>
  );
}