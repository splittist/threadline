import { List, type ListProps } from 'react-window'

interface DocumentListProps {
  documents: string[]
}

export function DocumentList({ documents }: DocumentListProps) {
  const rowProps = { documents }

  const rowComponent: ListProps<typeof rowProps>['rowComponent'] = ({
    index,
    style,
    documents,
  }) => {
    const doc = documents[index] || ''

    return (
      <div
        style={style}
        className="flex items-center px-4 border-b border-gray-200"
      >
        <span className="text-gray-700">{doc}</span>
      </div>
    )
  }

  return (
    <List
      rowComponent={rowComponent}
      rowProps={rowProps}
      rowCount={documents.length}
      rowHeight={50}
      defaultHeight={400}
    />
  )
}
