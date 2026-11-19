// Going back to plain /dashboard closes whatever popup was open. Without
// this page, an in-app navigation to /dashboard would leave the last popup
// showing, because Next.js keeps a slot's content when the new address
// doesn't match anything in it.
export default function NoPanel() {
  return null;
}
