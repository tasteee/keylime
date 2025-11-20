<script lang="ts">
</script>

<div class="ArrangementPanel">
	<div class="top">
		<p>Arrangement</p>
	</div>

	<div class="middle"></div>

	<div class="bottom">
		<p></p>
	</div>
</div>

<style>
	.ArrangementPanel {
		position: fixed;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 160px;
		padding: 12px;
		display: flex;
		flex-direction: column;
		background-color: var(--background);
		border-top: 1px solid var(--muted);
	}

	.top {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 4px 0;
	}

	.top p {
		margin: 0;
		font-weight: 600;
		font-size: 14px;
	}

	.middle {
		flex: 1;
		border-radius: 2px;
		border: 1px solid var(--muted);

		background:
			repeating-linear-gradient(
				to right,
				hsl(0, 0%, 20%) 0px,
				hsl(0, 0%, 20%) 1px,
				transparent 1px,
				transparent calc(100% / 16)
			),
			repeating-linear-gradient(to right, hsl(0, 0%, 8%) 0%, hsl(0, 0%, 8%) 25%, hsl(0, 0%, 12%) 25%, hsl(0, 0%, 12%) 50%);
	}

	.bottom {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 4px 0;
	}

	.bottom p {
		margin: 0;
	}
</style>
