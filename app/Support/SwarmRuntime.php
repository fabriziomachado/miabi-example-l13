<?php

declare(strict_types=1);

namespace App\Support;

final class SwarmRuntime
{
    /**
     * @return array{container: string, node: string}
     */
    public static function identity(): array
    {
        $hostname = gethostname();
        $container = is_string($hostname) && $hostname !== ''
            ? $hostname
            : (string) env('HOSTNAME', 'unknown');

        $node = (string) env('NODE_HOSTNAME', '');
        if ($node === '' || str_contains($node, '{{')) {
            $node = 'n/a';
        }

        return [
            'container' => $container,
            'node' => $node,
        ];
    }
}
