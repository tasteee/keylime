<script>
	import ChordCard from './ChordCard.svelte';
</script>

<section
	class="ChordCardGrid gap-4 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 grid grid-cols-2"
>
	<ChordCard note="Cmaj7" description="C E G B" />
	<ChordCard note="A#m" description="A# C# F" />
	<ChordCard note="G7" description="G B D F" />
	<ChordCard note="Dm" description="D F A" />
	<ChordCard note="Fmaj9" description="F A C E G" />
	<ChordCard note="E7b9" description="E G# B D F" />
</section>
