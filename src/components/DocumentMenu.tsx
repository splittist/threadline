import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'

export function DocumentMenu() {
  return (
    <Menu>
      <MenuButton className="inline-flex items-center gap-2 rounded-md bg-blue-600 py-2 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2">
        Options
        <ChevronDownIcon className="h-5 w-5" aria-hidden="true" />
      </MenuButton>
      <MenuItems className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
        <div className="py-1">
          <MenuItem>
            {({ focus }) => (
              <a
                href="#"
                className={`${
                  focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                } block px-4 py-2 text-sm`}
              >
                Open Document
              </a>
            )}
          </MenuItem>
          <MenuItem>
            {({ focus }) => (
              <a
                href="#"
                className={`${
                  focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                } block px-4 py-2 text-sm`}
              >
                Upload Document
              </a>
            )}
          </MenuItem>
          <MenuItem>
            {({ focus }) => (
              <a
                href="#"
                className={`${
                  focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                } block px-4 py-2 text-sm`}
              >
                View History
              </a>
            )}
          </MenuItem>
        </div>
      </MenuItems>
    </Menu>
  )
}
