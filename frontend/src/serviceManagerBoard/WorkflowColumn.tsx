import type { QueueItem } from "../QueueContext";
import { ManagerCallCard } from "./ManagerCallCard";
import { EmptyColumnState } from "./EmptyColumnState";
import type { BoardColumnId } from "./boardMapping";

type WorkflowColumnProps = {
  id: BoardColumnId;
  title: string;
  subtitle: string;
  icon: string;
  items: QueueItem[];
  filtering: boolean;
  onOpenItem: (item: QueueItem) => void;
};

export function WorkflowColumn({ id, title, subtitle, icon, items, filtering, onOpenItem }: WorkflowColumnProps) {
  return (
    <section className="smb-column" aria-label={`${title} column`}>
      <header className="smb-column-head">
        <div className="smb-column-title-row">
          <div className="smb-column-title">
            <span className="smb-column-icon">{icon}</span>
            <span>{title}</span>
          </div>
          <span className="smb-count">{items.length}</span>
        </div>
        <div className="smb-column-sub">{subtitle}</div>
      </header>
      {items.length > 0 ? (
        <div className="smb-cards">
          {items.map((item) => (
            <ManagerCallCard key={item.id} item={item} column={id} onClick={onOpenItem} />
          ))}
        </div>
      ) : (
        <EmptyColumnState filtering={filtering} />
      )}
    </section>
  );
}
