interface ObjectDescriptionProps {
  text: string;
}

type Block =
  | { kind: 'paragraph'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'list'; items: string[] };

const EMOJI = '\\p{Extended_Pictographic}\\u2600-\\u27BF';
const EMOJI_HEADING = new RegExp(`([${EMOJI}])\\s*([^-\\n]{0,90}?[:?])`, 'gu');

const ABBREVIATIONS = ['г', 'гг', 'ул', 'д', 'к', 'кв', 'м', 'км', 'руб', 'тыс', 'млн', 'стр', 'обл', 'пр', 'т'];

const protectAbbreviations = (text: string): string => {
  let out = text;
  for (const abbr of ABBREVIATIONS) {
    out = out.replace(new RegExp(`(^|[\\s(])${abbr}\\.\\s`, 'gi'), `$1${abbr}\u0000 `);
  }
  return out;
};

const restoreAbbreviations = (text: string): string => text.replace(/\u0000/g, '.');

const normalize = (raw: string): string => {
  let text = raw.replace(/\r\n/g, '\n').trim();

  if (!/\n/.test(text)) {
    text = protectAbbreviations(text);
    text = text.replace(EMOJI_HEADING, (_m, emoji, title) => `\n\n${emoji} ${title}\n`);
    text = text.replace(/\s+[-–—]\s+(?=[А-ЯЁA-Z0-9])/g, '\n- ');
    text = text.replace(/([.!?])\s+(?=[А-ЯЁA-Z][^\n]{25,})/g, '$1\n');
    text = restoreAbbreviations(text);
  }

  return text.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
};

const buildBlocks = (text: string): Block[] => {
  const blocks: Block[] = [];
  let list: string[] = [];

  const flushList = () => {
    if (list.length) {
      blocks.push({ kind: 'list', items: list });
      list = [];
    }
  };

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      continue;
    }

    const bullet = line.match(/^[-–—•*]\s*(.+)$/);
    if (bullet) {
      const item = bullet[1].trim();

      const tail = item.match(
        new RegExp(`^(.*?[.!?])\\s+([${EMOJI}]\\s*.+|[А-ЯЁA-Z][^.!?]{5,90}[:?])$`, 'u'),
      );
      if (tail) {
        list.push(tail[1].trim());
        flushList();
        blocks.push({ kind: 'heading', text: tail[2].trim() });
        continue;
      }

      list.push(item);
      continue;
    }

    const startsHeading = new RegExp(`^[${EMOJI}]`, 'u').test(line);
    const isHeading = line.length <= 95 && (line.endsWith(':') || startsHeading);

    if (list.length && !isHeading && !startsHeading) {
      list[list.length - 1] = `${list[list.length - 1]} ${line}`;
      continue;
    }

    flushList();
    blocks.push({ kind: isHeading ? 'heading' : 'paragraph', text: line });
  }

  flushList();
  return blocks;
};

const ObjectDescription = ({ text }: ObjectDescriptionProps) => {
  const blocks = buildBlocks(normalize(text));

  if (!blocks.length) return null;

  return (
    <div className="space-y-3 text-muted-foreground leading-relaxed">
      {blocks.map((block, i) => {
        if (block.kind === 'heading') {
          return (
            <p key={i} className="font-semibold text-foreground pt-1">
              {block.text}
            </p>
          );
        }

        if (block.kind === 'list') {
          return (
            <ul key={i} className="space-y-1.5 pl-1">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        }

        return <p key={i}>{block.text}</p>;
      })}
    </div>
  );
};

export default ObjectDescription;