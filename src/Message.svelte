<script>
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  let author = "";
  let message = "";
  let maxLength = 24;
  $: nbCaracters = message.length;
  $: disabled = message.length > maxLength ? true : false;

  function saveMessage() {
    const newMessage = {
      id: Date.now(),
      text: message,
      author: author ||'anonymous',
      date: new Date()
    };
    console.log("newMessage", newMessage);
    dispatch("message", newMessage);
    message = "";
    author = "";
  }
</script>

<style>
  .text {
    width: 382px;
  }
  .alert{
    color: orangered;
  }

</style>

<input class="text" type="text" bind:value={author} />
<br />
<textarea cols="50" rows="5" bind:value={message} />
<br />
<button on:click={saveMessage} disabled={disabled}>send</button>
<span class:alert={nbCaracters > maxLength}>{nbCaracters}</span>
{#if disabled}
  <span class="alert"> (message too long)</span>
{/if}
