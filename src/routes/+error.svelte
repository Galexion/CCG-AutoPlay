<script>
	import { page } from '$app/stores';
</script>

<h1 class="text-4xl font-extrabold">CGAutoplay ran into a Critical Error.</h1>
<p>Please Check the Following:</p>
<ul>
    <li>Is CasparCG Running?</li>
    <li>Is CGAutoplay Configured to see the CasparCG server?</li>
    <li>Are the servers on fire?</li>
</ul>
<p>Consult the System Logs in both CGAutoplay & CasparCG for more information.</p>
<h5>Status Code {$page.status}</h5>