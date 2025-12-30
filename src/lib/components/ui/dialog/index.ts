import { Dialog as DialogPrimitive } from 'bits-ui'
import Content from './dialog-content.svelte'
import Description from './dialog-description.svelte'
import Header from './dialog-header.svelte'
import Overlay from './dialog-overlay.svelte'
import Title from './dialog-title.svelte'
import Footer from './dialog-footer.svelte'

const Root = DialogPrimitive.Root
const Trigger = DialogPrimitive.Trigger
const Close = DialogPrimitive.Close
const Portal = DialogPrimitive.Portal

export {
	Root,
	Trigger,
	Close,
	Portal,
	Content,
	Description,
	Header,
	Overlay,
	Title,
	Footer,
	//
	Root as Dialog,
	Trigger as DialogTrigger,
	Close as DialogClose,
	Portal as DialogPortal,
	Content as DialogContent,
	Description as DialogDescription,
	Header as DialogHeader,
	Overlay as DialogOverlay,
	Title as DialogTitle,
	Footer as DialogFooter
}
